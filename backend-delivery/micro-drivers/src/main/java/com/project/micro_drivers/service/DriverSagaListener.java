package com.project.micro_drivers.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DriverSagaListener {

    private final DriverService driverService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = "queue.payment.ok")
    @Transactional
    public void handlePaymentOk(String messagePayload) {
        log.info("Received payment.ok event: {}", messagePayload);
        try {
            JsonNode rootNode = objectMapper.readTree(messagePayload);
            long orderId = rootNode.get("id").asLong();
            driverService.assignDriverToOrder(orderId, messagePayload);
        } catch (Exception e) {
            log.error("Error processing payment.ok event", e);
        }
    }
}
