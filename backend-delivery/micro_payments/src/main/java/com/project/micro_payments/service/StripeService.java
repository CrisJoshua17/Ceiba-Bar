package com.project.micro_payments.service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_payments.dto.OrderDto;
import com.project.micro_payments.dto.Payment;
import com.project.micro_payments.dto.StripeEventProcessed;
import com.project.micro_payments.feign.OrderClient;
import com.project.micro_payments.repository.PaymentRepository;
import com.project.micro_payments.repository.StripeEventProcessedRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeService {

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    private final PaymentRepository paymentRepository;
    private final StripeEventProcessedRepository stripeEventProcessedRepository;
    private final OrderClient orderClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    public Session createCheckoutSession(OrderDto orderDto, long amount, String nameProduct) throws StripeException {

        String orderId = orderDto.getId() != null ? orderDto.getId().toString()
                : "TEMP-" + UUID.randomUUID().toString();

        // Guardar la orden en formato JSON en la base de datos (tempOrderData)
        String orderJson = convertOrderToJson(orderDto);
        Payment payment = Payment.builder()
                .orderId(orderId)
                .amount(amount)
                .status("PENDING")
                .createdAt(Instant.now().toString())
                .tempOrderData(orderJson) // Guardamos localmente
                .build();
        paymentRepository.save(payment);

        // Crear Line Items
        SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                .setQuantity(1L)
                .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("mxn")
                                .setUnitAmount(amount)
                                .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                .setName(nameProduct)
                                                .build())
                                .build())
                .build();
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .addLineItem(lineItem)
                .putMetadata("orderId", orderId)
                // .putMetadata("orderData", convertOrderToJson(orderDto)) // REMOVIDO: Evitar
                // límite de 500 chars
                .build();
        Session session = Session.create(params);
        payment.setStripeSessionId(session.getId());
        paymentRepository.save(payment);
        return session;
    }

    // Procesa eventos de Stripe

    @Transactional
    public void handleEvent(Event event) {
        String eventId = event.getId();
        if (stripeEventProcessedRepository.existsById(eventId)) {
            return;
        }
        // Guardar marca de procesado
        StripeEventProcessed processed = new StripeEventProcessed(eventId, Instant.now());
        stripeEventProcessedRepository.save(processed);
        String type = event.getType();
        switch (type) {
            case "checkout.session.completed":
                // Obtener Sesion
                Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
                if (session != null) {
                    String sessionId = session.getId();
                    Optional<Payment> paymentOptional = paymentRepository.findByStripeSessionId(sessionId);
                    if (paymentOptional.isPresent()) {
                        Payment payment = paymentOptional.get();
                        payment.setStatus("PAID");
                        payment.setStripePaymentIntentId(session.getPaymentIntent());
                        payment.setUpdatedAt(Instant.now().toString());
                        paymentRepository.save(payment);
                        // Notificar a micro-realtime - CREAR LA ORDEN AHORA
                        // Leemos los datos desde nuestra BD, no desde Stripe
                        String orderData = payment.getTempOrderData();
                        if (orderData != null) {
                            OrderDto orderDto = convertJsonToOrder(orderData); // Necesitarás crear este método
                            try {
                                orderClient.create(orderDto).subscribe(); // Crear la orden de forma reactiva
                            } catch (Exception e) {
                                System.err.println("Error creando la orden: " + e.getMessage());
                            }
                        }
                    }
                    break;
                }
        }
    }

    private String convertOrderToJson(OrderDto orderDto) {
        try {
            return objectMapper.writeValueAsString(orderDto);
        } catch (Exception e) {
            throw new RuntimeException("Error convirtiendo orden a JSON", e);
        }
    }

    private OrderDto convertJsonToOrder(String json) {
        try {
            return objectMapper.readValue(json, OrderDto.class);
        } catch (Exception e) {
            throw new RuntimeException("Error convirtiendo JSON a orden", e);
        }
    }

    public Payment getPaymentBySessionId(String sessionId) {
        Payment payment = paymentRepository.findByStripeSessionId(sessionId).orElse(null);
        if (payment != null && "PENDING".equals(payment.getStatus())) {
            try {
                // Consultar a Stripe directamente (Pull Strategy)
                Session session = Session.retrieve(sessionId);
                if ("paid".equals(session.getPaymentStatus())) {
                    payment.setStatus("PAID");
                    payment.setStripePaymentIntentId(session.getPaymentIntent());
                    payment.setUpdatedAt(Instant.now().toString());
                    paymentRepository.save(payment);

                    // Crear la orden
                    String orderData = payment.getTempOrderData();
                    if (orderData != null) {
                        OrderDto orderDto = convertJsonToOrder(orderData);
                        try {
                            orderClient.create(orderDto).subscribe();
                        } catch (Exception e) {
                            System.err.println("Error creating order on validation: " + e.getMessage());
                        }
                    }
                }
            } catch (StripeException e) {
                System.err.println("Error fetching Stripe session: " + e.getMessage());
            }
        }
        return payment;
    }

}
