package com.project.micro_payments.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_payments.model.OutboxEvent;
import com.project.micro_payments.model.OutboxStatus;
import com.project.micro_payments.model.Payment;
import com.project.micro_payments.model.enums.PaymentStatus;
import com.project.micro_payments.repository.OutboxRepository;
import com.project.micro_payments.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentSagaListener {

    private final PaymentRepository paymentRepository;
    private final OutboxRepository outboxRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = "queue.stock.reserved")
    @Transactional
    public void handleStockReserved(org.springframework.amqp.core.Message message) {
        String messagePayload = new String(message.getBody(), java.nio.charset.StandardCharsets.UTF_8);
        log.info("Received stock.reserved event: {}", messagePayload);
        try {
            JsonNode rootNode = objectMapper.readTree(messagePayload);
            long orderId = rootNode.get("id").asLong();

            Optional<Payment> paymentOpt = paymentRepository.findByOrderId(orderId);
            if (paymentOpt.isPresent() && paymentOpt.get().getStatus() == PaymentStatus.COMPLETED) {
                log.info("Payment already completed for order id: {}. Publishing PAYMENT_OK", orderId);
                OutboxEvent outboxEvent = OutboxEvent.builder()
                        .aggregateType("Order")
                        .aggregateId(orderId)
                        .eventType("PAYMENT_OK")
                        .payload(objectMapper.writeValueAsString(rootNode))
                        .status(OutboxStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build();
                outboxRepository.save(outboxEvent);
            } else {
                log.warn("Payment not completed or not found for order id: {}. Publishing PAYMENT_FAILED", orderId);
                OutboxEvent outboxEvent = OutboxEvent.builder()
                        .aggregateType("Order")
                        .aggregateId(orderId)
                        .eventType("PAYMENT_FAILED")
                        .payload(objectMapper.writeValueAsString(rootNode))
                        .status(OutboxStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build();
                outboxRepository.save(outboxEvent);
            }
        } catch (Exception e) {
            log.error("Error processing stock.reserved event", e);
        }
    }

    @RabbitListener(queues = "queue.driver.unavailable")
    @Transactional
    public void handleDriverUnavailable(org.springframework.amqp.core.Message message) {
        String messagePayload = new String(message.getBody(), java.nio.charset.StandardCharsets.UTF_8);
        log.info("Received driver.unavailable event: {}", messagePayload);
        try {
            JsonNode rootNode = objectMapper.readTree(messagePayload);
            long orderId = rootNode.get("id").asLong();

            Optional<Payment> paymentOpt = paymentRepository.findByOrderId(orderId);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                log.info("Refunding payment for order id: {}", orderId);
                
                payment.setStatus(PaymentStatus.REFUNDED);
                payment.setUpdatedAt(LocalDateTime.now());
                paymentRepository.save(payment);
            }
        } catch (Exception e) {
            log.error("Error processing driver.unavailable event for refunds", e);
        }
    }
}
