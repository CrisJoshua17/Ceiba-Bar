package com.project.micro_realtime.service;

import java.time.LocalDateTime;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.project.micro_realtime.event.OrderStatusEvent;
import com.project.micro_realtime.model.OrderTracking;
import com.project.micro_realtime.repository.TrackingRepository;
import com.project.micro_realtime.websocket.config.TrackingWebSocketHandler;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Log4j2
public class KafkaConsumerService {

    private final TrackingRepository trackingRepository;
    private final TrackingWebSocketHandler trackingWebSocketHandler;

    @KafkaListener(topics = "order-status-updates", groupId = "realtime-group")
    public void consumeOrderStatus(OrderStatusEvent event) {
        log.info("Recibido evento de tracking: {}", event);

        // Guardar en MongoDB y luego notificar al WebSocket
        trackingRepository.findTopByOrderIdOrderByTimestampDesc(event.getOrderId())
                .defaultIfEmpty(new OrderTracking())
                .flatMap(lastTracking -> {

                    double lastLat = lastTracking.getLat() != null ? lastTracking.getLat() : 0.0;
                    double lastLng = lastTracking.getLng() != null ? lastTracking.getLng() : 0.0;
                    double newLat = event.getLat() != null ? event.getLat() : 0.0;
                    double newLng = event.getLng() != null ? event.getLng() : 0.0;

                    // Solo guardar si es el primer registro, cambio de estado, o movimiento
                    // significativo
                    boolean shouldSave = lastTracking.getOrderId() == null
                            || (lastTracking.getStatus() != null && !lastTracking.getStatus().equals(event.getStatus()))
                            || Math.abs(lastLat - newLat) > 0.0001
                            || Math.abs(lastLng - newLng) > 0.0001;

                    if (shouldSave) {
                        OrderTracking tracking = new OrderTracking();
                        tracking.setOrderId(event.getOrderId());
                        tracking.setStatus(event.getStatus());
                        tracking.setDriverId(event.getDriverId());
                        tracking.setLat(newLat);
                        tracking.setLng(newLng);
                        tracking.setTimestamp(
                                event.getTimestamp() != null ? event.getTimestamp() : LocalDateTime.now());

                        return trackingRepository.save(tracking)
                                .doOnNext(saved -> {
                                    log.debug("Tracking guardado: {}", saved);
                                    // Notificar al WebSocket Handler
                                    trackingWebSocketHandler.sendUpdate(saved);
                                });
                    } else {
                        return Mono.empty();
                    }
                })
                .subscribe(); // Suscribirse para ejecutar el reactive stream
    }
}
