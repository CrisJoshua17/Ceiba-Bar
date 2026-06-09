package com.project.micro_payments.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_payments.dto.OrderDto;
import com.project.micro_payments.model.Payment;
import com.project.micro_payments.model.StripeEventProcessed;
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

@Component("stripe")
@RequiredArgsConstructor
public class StripeGateway implements PaymentGateway {

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

    @Override
    public String createPayment(Payment payment, OrderDto orderDto, String itemProduct) throws Exception {
        String metadataOrderId = payment.getOrderId() != null ? payment.getOrderId().toString()
                : "TEMP-" + UUID.randomUUID().toString();

        SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                .setQuantity(1L)
                .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(payment.getCurrency().toLowerCase())
                                .setUnitAmount(payment.getAmount().multiply(new BigDecimal("100")).longValue()) // Stripe requiere centavos
                                .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                .setName(itemProduct)
                                                .build())
                                .build())
                .build();
                
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .addLineItem(lineItem)
                .putMetadata("orderId", metadataOrderId)
                .putMetadata("paymentId", payment.getId().toString())
                .build();
                
        Session session = Session.create(params);
        payment.setStripeSessionId(session.getId());
        return session.getUrl();
    }

    @Override
    public boolean validatePayment(Payment payment) throws Exception {
        if (payment.getStripeSessionId() == null) return false;
        try {
            Session session = Session.retrieve(payment.getStripeSessionId());
            if ("paid".equals(session.getPaymentStatus())) {
                payment.setStripePaymentIntentId(session.getPaymentIntent());
                return true;
            }
        } catch (StripeException e) {
            System.err.println("Error fetching Stripe session: " + e.getMessage());
        }
        return false;
    }

    @Override
    public boolean refundPayment(Payment payment, BigDecimal amount, String reason) throws Exception {
        // Implementación de reembolso con Stripe
        return false;
    }

    @Transactional
    public void handleWebhookEvent(Event event) {
        String eventId = event.getId();
        if (stripeEventProcessedRepository.existsById(eventId)) {
            return;
        }
        stripeEventProcessedRepository.save(new StripeEventProcessed(eventId, Instant.now()));
        
        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                String sessionId = session.getId();
                Optional<Payment> paymentOptional = paymentRepository.findByStripeSessionId(sessionId);
                if (paymentOptional.isPresent()) {
                    Payment payment = paymentOptional.get();
                    payment.setStatus(com.project.micro_payments.model.enums.PaymentStatus.COMPLETED);
                    payment.setStripePaymentIntentId(session.getPaymentIntent());
                    payment.setUpdatedAt(java.time.LocalDateTime.now());
                    paymentRepository.save(payment);
                    
                    String orderData = payment.getTempOrderData();
                    if (orderData != null) {
                        try {
                            OrderDto orderDto = objectMapper.readValue(orderData, OrderDto.class);
                            orderClient.create(orderDto).subscribe(); 
                        } catch (Exception e) {
                            System.err.println("Error creando la orden tras el webhook: " + e.getMessage());
                        }
                    }
                }
            }
        }
    }
}
