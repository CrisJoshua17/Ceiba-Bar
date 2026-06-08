package com.project.micro_realtime.util;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.project.micro_realtime.event.OrderStatusEvent;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;
import com.project.micro_realtime.repository.OrderRepository;
import com.project.micro_realtime.service.KafkaProducerService;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@RequiredArgsConstructor
@Log4j2
public class LocationSimulator {

    private final KafkaProducerService kafkaProducerService;
    private final OrderRepository orderRepository;
    private final com.project.micro_realtime.websocket.config.TrackingWebSocketHandler trackingWebSocketHandler;

    // Estado de cada orden en simulación
    private final Map<Long, OrderState> activeSimulations = new ConcurrentHashMap<>();

    // Velocidad de simulación (fracción del camino recorrido en cada paso)
    // 0.15 significa que recorre el 15% restante en cada paso
    private double movementFraction = 0.15;

    // Posición inicial default (donde supuestamente salen todos los drivers)
    private static final double START_LAT = 19.4326;
    private static final double START_LNG = -99.1332;

    @Data
    @AllArgsConstructor
    private static class OrderState {
        private double currentLat;
        private double currentLng;
    }

    @Scheduled(fixedRate = 3000)
    public void simulateMovement() {
        log.debug("Ejecutando ciclo de simulación de movimiento...");

        Mono.fromCallable(() -> orderRepository.findByStatus(OrderStatus.EN_CAMINO))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMapMany(Flux::fromIterable)
                .flatMap(this::processOrderMovement)
                .subscribe();
    }

    private Mono<Void> processOrderMovement(Order order) {
        Long orderId = order.getId();

        // OPTIMIZACIÓN: Solo simular si hay alguien viendo (WebSocket activo)
        if (!trackingWebSocketHandler.hasActiveSubscribers(orderId)) {
            // Si teníamos estado previo, podríamos limpiarlo o mantenerlo pausado.
            // Por simplicidad, si nadie ve, no gastamos CPU calculando movimiento.
            if (activeSimulations.containsKey(orderId)) {
                log.debug("⏸️ Pausando simulación para Orden {} (sin espectadores)", orderId);
            }
            return Mono.empty();
        }

        double targetLat = order.getDeliveryLatitude() != null ? order.getDeliveryLatitude() : 0.0;
        double targetLng = order.getDeliveryLongitude() != null ? order.getDeliveryLongitude() : 0.0;

        // Validar coordenadas de destino y aplicar fallback si es necesario
        if (targetLat == 0.0 || targetLng == 0.0) {
            log.warn("⚠️ Pedido {} sin coordenadas. Usando fallback LEJANO (Sur CDMX) para simulación.", orderId);
            targetLat = 19.3326;
            targetLng = -99.1332;
        }

        // Obtener o inicializar el estado de simulación para esta orden
        OrderState state = activeSimulations.computeIfAbsent(orderId, id -> {
            log.info("🚀 Iniciando nueva simulación para pedido {}", id);
            return new OrderState(START_LAT, START_LNG);
        });

        // Calcular distancia actual al destino
        double distance = haversine(state.getCurrentLat(), state.getCurrentLng(), targetLat, targetLng);

        // Verificar si ya llegó (distancia < 50 metros)
        if (distance < 0.05) {
            log.info("🎉 ¡Pedido {} llegó a su destino! ({} km restantes)", orderId, String.format("%.4f", distance));
            activeSimulations.remove(orderId);
            return markAsDelivered(orderId, targetLat, targetLng);
        }

        // Calcular nueva posición (moviéndose un fraction del camino)
        double newLat = state.getCurrentLat() + (targetLat - state.getCurrentLat()) * movementFraction;
        double newLng = state.getCurrentLng() + (targetLng - state.getCurrentLng()) * movementFraction;

        // Actualizar estado
        state.setCurrentLat(newLat);
        state.setCurrentLng(newLng);

        log.info("📍 Pedido {}: ({}, {}) → {} km para destino",
                orderId, String.format("%.6f", newLat), String.format("%.6f", newLng), String.format("%.4f", distance));

        return sendTrackingEvent(orderId, newLat, newLng, targetLat, targetLng).then();
    }

    private Mono<String> sendTrackingEvent(Long orderId, double lat, double lng, double deliveryLat,
            double deliveryLng) {
        OrderStatusEvent event = new OrderStatusEvent(
                orderId,
                "EN_CAMINO",
                "driver-001", // Por simplicidad, todos usan el mismo driver-id en el simulador
                LocalDateTime.now(),
                lat,
                lng,
                deliveryLat,
                deliveryLng);

        kafkaProducerService.sendStatusUpdate(event);
        return Mono.just("Evento enviado");
    }

    private Mono<Void> markAsDelivered(Long orderId, double finalLat, double finalLng) {
        log.info("✅ Enviando evento FINAL de entrega para pedido {}", orderId);

        OrderStatusEvent event = new OrderStatusEvent(
                orderId,
                "ENTREGADO",
                "driver-001",
                LocalDateTime.now(),
                finalLat,
                finalLng,
                finalLat,
                finalLng);

        kafkaProducerService.sendStatusUpdate(event);
        return Mono.empty();
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Radio de la Tierra en km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Método para ajustar la velocidad desde otros servicios si fuera necesario
    public void setMovementFraction(double fraction) {
        if (fraction > 0 && fraction <= 1) {
            this.movementFraction = fraction;
            log.info("⚡ Velocidad de simulación actualizada a: {}", fraction);
        }
    }
}
