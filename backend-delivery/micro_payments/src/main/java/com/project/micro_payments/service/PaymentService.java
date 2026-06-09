package com.project.micro_payments.service;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_payments.dto.CheckoutRequest;
import com.project.micro_payments.dto.OrderDto;
import com.project.micro_payments.feign.OrderClient;
import com.project.micro_payments.model.Payment;
import com.project.micro_payments.model.enums.PaymentMethod;
import com.project.micro_payments.model.enums.PaymentStatus;
import com.project.micro_payments.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final Map<String, PaymentGateway> gateways; // Spring injects both stripe and paypal
    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;
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

        Payment payment = Payment.builder()
                .orderId(req.getOrderDto().getId())
                .amount(java.math.BigDecimal.valueOf(req.getAmount() / 100.0)) // Asumiendo que req.getAmount() está en centavos
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
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setUpdatedAt(java.time.LocalDateTime.now());
                paymentRepository.save(payment);

                // Disparar orden
                if (payment.getTempOrderData() != null) {
                    try {
                        OrderDto dto = objectMapper.readValue(payment.getTempOrderData(), OrderDto.class);
                        orderClient.create(dto).subscribe();
                    } catch (Exception e) {
                        System.err.println("Error creando la orden post-validación: " + e.getMessage());
                    }
                }
            }
        }

        return payment;
    }
}
