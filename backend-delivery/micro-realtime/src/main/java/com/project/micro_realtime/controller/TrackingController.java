package com.project.micro_realtime.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.micro_realtime.model.OrderTracking;
import com.project.micro_realtime.repository.TrackingRepository;
import com.project.micro_realtime.repository.OrderRepository;
import com.project.micro_realtime.service.GeocodingService;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingRepository trackingRepository;
    private final OrderRepository orderRepository;
    private final GeocodingService geocodingService;

    @GetMapping("/{orderId}")
    public Flux<OrderTracking> getTracking(@PathVariable Long orderId) {
        return trackingRepository.findByOrderIdOrderByTimestampAsc(orderId);
    }

    @GetMapping("/{orderId}/latest")
    public Mono<OrderTracking> getLatestTracking(@PathVariable Long orderId) {
        return trackingRepository.findTopByOrderIdOrderByTimestampDesc(orderId)
                .defaultIfEmpty(new OrderTracking()) // Evitar nulls
                .flatMap(tracking -> {
                    // Si ya tiene destino válido, devolverlo
                    if (tracking.getDeliveryLat() != null && tracking.getDeliveryLat() != 0.0) {
                        return Mono.just(tracking);
                    }

                    // Si no tiene destino, buscar en la orden original (SQL)
                    return enrichTrackingWithOrderData(tracking, orderId);
                });
    }

    private Mono<OrderTracking> enrichTrackingWithOrderData(OrderTracking tracking, Long orderId) {
        return Mono.fromCallable(() -> orderRepository.findById(orderId).orElse(null))
                .flatMap(order -> {
                    if (order == null)
                        return Mono.just(tracking);

                    // Asegurar datos básicos si el tracking era nuevo/vacío
                    if (tracking.getOrderId() == null)
                        tracking.setOrderId(orderId);
                    if (tracking.getStatus() == null)
                        tracking.setStatus(order.getStatus().toString());

                    // Intento 1: Usar coordenadas ya guardadas en la orden
                    if (order.getDestinationLat() != null && order.getDestinationLat() != 0.0) {
                        tracking.setDeliveryLat(order.getDestinationLat());
                        tracking.setDeliveryLng(order.getDestinationLng());
                        return Mono.just(tracking);
                    }

                    // Intento 2: Geocodificar dirección "al vuelo"
                    if (order.getAddress() != null && !order.getAddress().isEmpty()) {
                        return geocodingService.geocode(order.getAddress())
                                .map(coords -> {
                                    tracking.setDeliveryLat(coords.lat());
                                    tracking.setDeliveryLng(coords.lng());
                                    return tracking;
                                })
                                // Si falla geocodificación, usar fallback
                                .switchIfEmpty(Mono.defer(() -> {
                                    tracking.setDeliveryLat(19.3326); // Sur CDMX
                                    tracking.setDeliveryLng(-99.1332);
                                    return Mono.just(tracking);
                                }));
                    }

                    // Intento 3: Fallback directo (si no hay dirección ni coordenadas)
                    tracking.setDeliveryLat(19.3326);
                    tracking.setDeliveryLng(-99.1332);
                    return Mono.just(tracking);
                });
    }
}
