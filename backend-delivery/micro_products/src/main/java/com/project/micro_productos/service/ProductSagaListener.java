package com.project.micro_productos.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_productos.model.OutboxEvent;
import com.project.micro_productos.model.OutboxStatus;
import com.project.micro_productos.model.Product;
import com.project.micro_productos.model.StockReservation;
import com.project.micro_productos.model.enums.ReservationStatus;
import com.project.micro_productos.repository.OutboxRepository;
import com.project.micro_productos.repository.StockReservationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductSagaListener {

    private final ProductService productService;
    private final StockReservationRepository stockReservationRepository;
    private final OutboxRepository outboxRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = "queue.order.created")
    @Transactional
    public void handleOrderCreated(String messagePayload) {
        log.info("Received order.created event: {}", messagePayload);
        try {
            JsonNode rootNode = objectMapper.readTree(messagePayload);
            long orderId = rootNode.get("id").asLong();
            JsonNode itemsNode = rootNode.get("items");

            boolean reservationFailed = false;
            List<StockReservation> reservations = new ArrayList<>();

            if (itemsNode != null && itemsNode.isArray()) {
                for (JsonNode item : itemsNode) {
                    long productId = item.get("productId").asLong();
                    int quantity = item.get("quantity").asInt();

                    Optional<Product> productOpt = productService.findProductById(productId);
                    if (productOpt.isEmpty() || !productOpt.get().getAvailable()) {
                        reservationFailed = true;
                        break;
                    }

                    StockReservation reservation = StockReservation.builder()
                            .orderId(orderId)
                            .productId(productId)
                            .quantity(quantity)
                            .status(ReservationStatus.RESERVED)
                            .expiresAt(LocalDateTime.now().plusMinutes(5))
                            .build();
                    reservations.add(reservation);
                }
            }

            if (reservationFailed) {
                log.warn("Stock reservation failed for order id: {}", orderId);
                OutboxEvent outboxEvent = OutboxEvent.builder()
                        .aggregateType("Order")
                        .aggregateId(orderId)
                        .eventType("STOCK_FAILED")
                        .payload(objectMapper.writeValueAsString(rootNode))
                        .status(OutboxStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build();
                outboxRepository.save(outboxEvent);
            } else {
                log.info("Reserving stock for order id: {}", orderId);
                stockReservationRepository.saveAll(reservations);
                
                OutboxEvent outboxEvent = OutboxEvent.builder()
                        .aggregateType("Order")
                        .aggregateId(orderId)
                        .eventType("STOCK_RESERVED")
                        .payload(objectMapper.writeValueAsString(rootNode))
                        .status(OutboxStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build();
                outboxRepository.save(outboxEvent);
            }
        } catch (Exception e) {
            log.error("Error processing order.created event", e);
        }
    }

    @RabbitListener(queues = "queue.payment.failed")
    @Transactional
    public void handlePaymentFailed(String messagePayload) {
        releaseStock(messagePayload);
    }

    @RabbitListener(queues = "queue.driver.unavailable")
    @Transactional
    public void handleDriverUnavailable(String messagePayload) {
        releaseStock(messagePayload);
    }

    private void releaseStock(String messagePayload) {
        try {
            JsonNode rootNode = objectMapper.readTree(messagePayload);
            long orderId = rootNode.get("id").asLong();
            log.info("Releasing stock for order id: {}", orderId);

            List<StockReservation> reservations = stockReservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.RESERVED);
            for (StockReservation reservation : reservations) {
                reservation.setStatus(ReservationStatus.RELEASED);
                reservation.setUpdatedAt(LocalDateTime.now());
            }
            stockReservationRepository.saveAll(reservations);
        } catch (Exception e) {
            log.error("Error releasing stock for message: {}", messagePayload, e);
        }
    }
}
