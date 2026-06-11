package com.project.micro_realtime.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_realtime.model.Delivery;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;
import com.project.micro_realtime.repository.DeliveryRepository;
import com.project.micro_realtime.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderSagaListener {

    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = "queue.driver.assigned")
    @Transactional
    public void handleDriverAssigned(org.springframework.amqp.core.Message message) {
        String messagePayload = new String(message.getBody(), java.nio.charset.StandardCharsets.UTF_8);
        log.info("Saga Success: Received driver.assigned: {}", messagePayload);
        try {
            JsonNode rootNode = objectMapper.readTree(messagePayload);
            long orderId = rootNode.get("id").asLong();
            long driverId = rootNode.get("driverId").asLong();

            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                if (order.getStatus() == OrderStatus.CREATED) {
                    order.setDriverId(driverId);
                    order.nextState();
                    order.setUpdatedAt(LocalDateTime.now());
                    orderRepository.save(order);
                    log.info("Order id: {} advanced to PREPARING and driver id: {} assigned", orderId, driverId);

                    Delivery delivery = Delivery.builder()
                            .order(order)
                            .driverId(driverId)
                            .assignedAt(LocalDateTime.now())
                            .deliveryLatitude(order.getDeliveryLatitude())
                            .deliveryLongitude(order.getDeliveryLongitude())
                            .pickupLatitude(19.4326)
                            .pickupLongitude(-99.1332)
                            .status(com.project.micro_realtime.model.DeliveryStatus.ASSIGNED)
                            .build();
                    deliveryRepository.save(delivery);
                }
            }
        } catch (Exception e) {
            log.error("Error processing driver.assigned event", e);
        }
    }

    @RabbitListener(queues = "queue.stock.failed")
    @Transactional
    public void handleStockFailed(org.springframework.amqp.core.Message message) {
        String messagePayload = new String(message.getBody(), java.nio.charset.StandardCharsets.UTF_8);
        cancelSagaOrder(messagePayload, "stock.failed");
    }

    @RabbitListener(queues = "queue.payment.failed")
    @Transactional
    public void handlePaymentFailed(org.springframework.amqp.core.Message message) {
        String messagePayload = new String(message.getBody(), java.nio.charset.StandardCharsets.UTF_8);
        cancelSagaOrder(messagePayload, "payment.failed");
    }

    @RabbitListener(queues = "queue.driver.unavailable")
    @Transactional
    public void handleDriverUnavailable(org.springframework.amqp.core.Message message) {
        String messagePayload = new String(message.getBody(), java.nio.charset.StandardCharsets.UTF_8);
        cancelSagaOrder(messagePayload, "driver.unavailable");
    }

    private void cancelSagaOrder(String messagePayload, String cause) {
        log.warn("Saga Compensation: Received {} event. Cancelling order.", cause);
        try {
            JsonNode rootNode = objectMapper.readTree(messagePayload);
            long orderId = rootNode.get("id").asLong();

            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                if (order.getStatus() != OrderStatus.CANCELADO) {
                    order.cancelState();
                    order.setUpdatedAt(LocalDateTime.now());
                    orderRepository.save(order);
                    log.warn("Order id: {} has been CANCELLED due to {}", orderId, cause);
                }
            }
        } catch (Exception e) {
            log.error("Error cancelling order in Saga compensation", e);
        }
    }
}
