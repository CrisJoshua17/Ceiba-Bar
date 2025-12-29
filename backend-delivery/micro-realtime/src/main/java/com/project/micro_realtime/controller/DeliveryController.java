package com.project.micro_realtime.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.micro_realtime.dto.LatLng;
import com.project.micro_realtime.event.OrderStatusEvent;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;
import com.project.micro_realtime.model.OrderTracking;
import com.project.micro_realtime.repository.OrderRepository;
import com.project.micro_realtime.repository.TrackingRepository;
import com.project.micro_realtime.service.GeocodingService;
import com.project.micro_realtime.service.KafkaProducerService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
@Log4j2
public class DeliveryController {

    private final OrderRepository orderRepository;
    private final GeocodingService geocodingService;
    private final TrackingRepository trackingRepository;
    private final KafkaProducerService kafkaProducerService;

    @PostMapping("/{orderId}/address")
    public Mono<ResponseEntity<Map<String, String>>> setDeliveryAddress(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body) {

        String address = body.get("address");

        if (address == null || address.isBlank()) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("message", "Error: La dirección no puede estar vacía")));
        }

        return geocodingService.geocode(address)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("⚠️  Usando coordenadas por defecto para: {}", address);
                    return Mono.just(new LatLng(19.4326077, -99.133208));
                }))
                .flatMap(dest -> processDelivery(orderId, address, dest))
                .map(result -> ResponseEntity.ok(Map.of("message", result)))
                .onErrorResume(e -> Mono.just(ResponseEntity.badRequest()
                        .body(Map.of("message", "Error: " + e.getMessage()))));
    }

    private Mono<String> processDelivery(Long orderId, String address, LatLng dest) {
        return Mono.fromSupplier(() -> {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

            order.setAddress(address);
            order.setDestinationLat(dest.lat());
            order.setDestinationLng(dest.lng());
            order.setStatus(OrderStatus.EN_CAMINO);

            return orderRepository.save(order);
        })
                .publishOn(Schedulers.boundedElastic()) // ← Hilo bloqueante seguro
                .flatMap(savedOrder -> {
                    OrderTracking tracking = new OrderTracking();
                    tracking.setOrderId(orderId);
                    tracking.setStatus("EN_CAMINO");
                    tracking.setDriverId("driver-001");
                    tracking.setDeliveryLat(dest.lat());
                    tracking.setDeliveryLng(dest.lng());
                    tracking.setTimestamp(LocalDateTime.now());
                    tracking.setLat(19.4326);
                    tracking.setLng(-99.1332);

                    return trackingRepository.save(tracking);
                })
                .doOnSuccess(tracking -> {
                    OrderStatusEvent event = new OrderStatusEvent(
                            orderId, "EN_CAMINO", "driver-001",
                            LocalDateTime.now(), dest.lat(), dest.lng());
                    kafkaProducerService.sendStatusUpdate(event);
                })
                .thenReturn("Destino guardado exitosamente: " + address);
    }
}