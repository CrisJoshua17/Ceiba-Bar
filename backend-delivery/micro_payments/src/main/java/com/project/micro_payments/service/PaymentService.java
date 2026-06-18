package com.project.micro_payments.service;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_payments.dto.CheckoutRequest;
import com.project.micro_payments.dto.OrderDto;
import com.project.micro_payments.dto.ProductDto;
import com.project.micro_payments.feign.OrderClient;
import com.project.micro_payments.feign.ProductClient;
import com.project.micro_payments.model.Payment;
import com.project.micro_payments.model.enums.PaymentMethod;
import com.project.micro_payments.model.enums.PaymentStatus;
import com.project.micro_payments.repository.PaymentRepository;
import java.math.BigDecimal;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final Map<String, PaymentGateway> gateways; // Spring injects both stripe and paypal
    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;
    private final ProductClient productClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public String initiatePayment(CheckoutRequest req) throws Exception {
        String idempotencyKey = req.getIdempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existingOpt = paymentRepository.findByIdempotencyKey(idempotencyKey);
            if (existingOpt.isPresent()) {
                Payment pay = existingOpt.get();
                if (PaymentStatus.COMPLETED.equals(pay.getStatus())) {
                    throw new IllegalStateException("El pago para esta orden ya fue completado.");
                }
                if (PaymentMethod.STRIPE.equals(pay.getMethod()) && pay.getStripeSessionId() != null) {
                    return "https://checkout.stripe.com/c/pay/" + pay.getStripeSessionId(); // Approximated URL for retry
                }
                if (PaymentMethod.PAYPAL.equals(pay.getMethod()) && pay.getPaypalOrderId() != null) {
                    return "https://www.sandbox.paypal.com/checkoutnow?token=" + pay.getPaypalOrderId();
                }
            }
        }

        PaymentMethod method = PaymentMethod.valueOf(req.getMethod().toUpperCase());
        PaymentGateway gateway = gateways.get(req.getMethod().toLowerCase());

        if (gateway == null) {
            throw new IllegalArgumentException("Pasarela de pago no soportada: " + req.getMethod());
        }

        BigDecimal calculatedAmount = BigDecimal.ZERO;
        if (req.getOrderDto().getProducts() != null) {
            for (ProductDto prod : req.getOrderDto().getProducts()) {
                int qty = (prod.getQuantity() != null && prod.getQuantity() > 0) ? prod.getQuantity() : 1;
                try {
                    Map<String, Object> response = productClient.getProductById(prod.getId());
                    if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                        Map<String, Object> data = (Map<String, Object>) response.get("data");
                        if (data != null && data.get("price") != null) {
                            double realPrice = Double.parseDouble(data.get("price").toString());
                            BigDecimal itemCost = BigDecimal.valueOf(realPrice).multiply(BigDecimal.valueOf(qty));
                            calculatedAmount = calculatedAmount.add(itemCost);
                            // Sincronizar el DTO temporal
                            prod.setPrice(realPrice);
                        } else {
                            throw new IllegalStateException("El producto con ID " + prod.getId() + " no tiene un precio configurado en el catálogo.");
                        }
                    } else {
                        throw new IllegalStateException("El servicio de catálogo no encontró el producto ID: " + prod.getId());
                    }
                } catch (Exception e) {
                    log.error("Fallo al validar precio del producto ID {}: {}", prod.getId(), e.getMessage());
                    throw new IllegalArgumentException("No se pudo validar el precio real del producto ID " + prod.getId() + ": " + e.getMessage());
                }
            }
        }

        Payment payment = Payment.builder()
                .orderId(req.getOrderDto().getId())
                .amount(calculatedAmount)
                .method(method)
                .status(PaymentStatus.PENDING)
                .idempotencyKey(req.getIdempotencyKey())
                .tempOrderData(objectMapper.writeValueAsString(req.getOrderDto()))
                .build();
        payment.setCreatedAt(java.time.LocalDateTime.now());
        paymentRepository.save(payment);

        String redirectUrl = gateway.createPayment(payment, req.getOrderDto(), req.getItemProduct());
        paymentRepository.save(payment); // Guarda los IDs generados por la pasarela (ej: sessionId de Stripe)

        return redirectUrl;
    }

    @Transactional
    public Payment validatePaymentBySessionOrOrder(String identifier, String method) throws Exception {
        Payment payment = null;
        if ("stripe".equalsIgnoreCase(method)) {
            payment = paymentRepository.findByStripeSessionId(identifier).orElse(null);
        } else if ("paypal".equalsIgnoreCase(method)) {
            payment = paymentRepository.findByPaypalOrderId(identifier).orElse(null);
        }

        if (payment == null) {
            return null;
        }

        if (PaymentStatus.COMPLETED.equals(payment.getStatus())) {
            return payment; // Ya estaba validado
        }

        PaymentGateway gateway = gateways.get(payment.getMethod().name().toLowerCase());
        if (gateway != null) {
            boolean isCompleted = gateway.validatePayment(payment);
            if (isCompleted) {
                String intentOrCaptureId = (payment.getMethod() == PaymentMethod.STRIPE) ? payment.getStripePaymentIntentId() : payment.getPaypalOrderId();
                completePaymentAndCreateOrder(payment, intentOrCaptureId);
            }
        }

        return payment;
    }

    @Transactional
    public void completePaymentAndCreateOrder(Payment payment, String paymentIntentOrCaptureId) {
        if (PaymentStatus.COMPLETED.equals(payment.getStatus()) && payment.getOrderId() != null) {
            return; // Ya procesado y orden creada
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        if (payment.getMethod() == PaymentMethod.STRIPE) {
            payment.setStripePaymentIntentId(paymentIntentOrCaptureId);
        }
        payment.setUpdatedAt(java.time.LocalDateTime.now());
        paymentRepository.save(payment); // Guardamos estado COMPLETED inicial

        // Disparar orden
        if (payment.getTempOrderData() != null) {
            try {
                OrderDto dto = objectMapper.readValue(payment.getTempOrderData(), OrderDto.class);
                dto.setTotal(payment.getAmount().doubleValue());
                dto.setSubtotal(payment.getAmount().doubleValue()); // Simplificación
                dto.setDeliveryFee(0.0);
                dto.setDiscount(0.0);
                dto.setTip(0.0);
                dto.setPaymentMethod(payment.getMethod().name().toLowerCase());
                
                Long createdOrderId = callOrderClient(dto);
                if (createdOrderId != null) {
                    payment.setOrderId(createdOrderId);
                    paymentRepository.save(payment);
                    log.info("Pago ID {} completado y Orden ID {} asociada con éxito.", payment.getId(), createdOrderId);
                }
            } catch (Exception e) {
                log.error("Error creando la orden tras completar el pago ID {}: {}", payment.getId(), e.getMessage());
            }
        }
    }

    /**
     * Llama a orderClient.create() protegida con CircuitBreaker, Retry y Bulkhead.
     */
    @CircuitBreaker(name = "orderClient", fallbackMethod = "fallbackCreateOrder")
    @Retry(name = "orderClient")
    @Bulkhead(name = "orderClient")
    public Long callOrderClient(OrderDto dto) {
        log.info("[Resilience4j] Llamando a orderClient.create para orderId={}", dto.getId());
        java.util.Map<String, Object> res = orderClient.create(dto);
        if (res != null && res.get("data") != null) {
            java.util.Map<String, Object> data = (java.util.Map<String, Object>) res.get("data");
            if (data.containsKey("id")) {
                return Long.valueOf(data.get("id").toString());
            }
        }
        return null;
    }

    /**
     * Fallback activado si orderClient falla tras los reintentos o el circuito está abierto.
     */
    public Long fallbackCreateOrder(OrderDto dto, Throwable t) {
        log.error("[Resilience4j] Fallback activado para creación de orden id={}. Razón: {}",
                dto != null ? dto.getId() : "null", t.getMessage());
        return null;
    }
}
