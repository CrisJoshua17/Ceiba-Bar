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
import com.project.micro_realtime.feign.DriverClient;
import com.project.micro_realtime.dto.DriverDto;

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
    private final DriverClient driverClient;

    // Estado de cada orden en simulación
    private final Map<Long, OrderState> activeSimulations = new ConcurrentHashMap<>();

    // Velocidad de simulación (fracción del camino recorrido en cada paso)
    // Ajustado a 0.005 (30 veces más lento que el original) a petición del usuario para mejor observación
    private double movementFraction = 0.005;

    // Posición inicial default (restaurante)
    private static final double RESTAURANT_LAT = 19.4326;
    private static final double RESTAURANT_LNG = -99.1332;

    @Data
    @AllArgsConstructor
    private static class OrderState {
        private double currentLat;
        private double currentLng;
        private boolean pickedUp; // false = moving to restaurant, true = moving to customer
        private String driverIdStr;
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
            if (activeSimulations.containsKey(orderId)) {
                log.debug("⏸️ Pausando simulación para Orden {} (sin espectadores)", orderId);
            }
            return Mono.empty();
        }

        double destLat = order.getDeliveryLatitude() != null ? order.getDeliveryLatitude() : 0.0;
        double destLng = order.getDeliveryLongitude() != null ? order.getDeliveryLongitude() : 0.0;

        // Validar coordenadas de destino y aplicar fallback si es necesario
        if (destLat == 0.0 || destLng == 0.0) {
            log.warn("⚠️ Pedido {} sin coordenadas. Usando fallback LEJANO (Sur CDMX) para simulación.", orderId);
            destLat = 19.3326;
            destLng = -99.1332;
        }

        // Obtener o inicializar el estado de simulación para esta orden
        double startLat = 19.4526; // Fallback driver latitude (slightly offset from restaurant)
        double startLng = -99.1532; // Fallback driver longitude (slightly offset from restaurant)
        String driverIdStr = "driver-001";

        if (order.getDriverId() != null) {
            driverIdStr = order.getDriverId().toString();
            try {
                DriverDto driverDto = driverClient.getDriverById(order.getDriverId());
                if (driverDto != null && driverDto.getCurrentLatitude() != null && driverDto.getCurrentLongitude() != null) {
                    startLat = driverDto.getCurrentLatitude();
                    startLng = driverDto.getCurrentLongitude();
                }
            } catch (Exception e) {
                log.warn("No se pudo obtener la ubicación del driver id: {} por Feign. Usando coordenadas fallback.", order.getDriverId());
            }
        }

        final double fStartLat = startLat;
        final double fStartLng = startLng;
        final String fDriverIdStr = driverIdStr;

        OrderState state = activeSimulations.computeIfAbsent(orderId, id -> {
            log.info("🚀 Iniciando nueva simulación doble-fase para pedido {}", id);
            return new OrderState(fStartLat, fStartLng, false, fDriverIdStr);
        });

        // FASE 1: Driver -> Restaurante
        if (!state.isPickedUp()) {
            double distanceToRestaurant = haversine(state.getCurrentLat(), state.getCurrentLng(), RESTAURANT_LAT, RESTAURANT_LNG);

            // Si está muy cerca del restaurante (< 0.05 km), marcar como recogido y pasar a FASE 2
            if (distanceToRestaurant < 0.05) {
                log.info("📦 ¡Driver {} llegó al restaurante y recogió el pedido {}!", state.getDriverIdStr(), orderId);
                state.setPickedUp(true);
                state.setCurrentLat(RESTAURANT_LAT);
                state.setCurrentLng(RESTAURANT_LNG);
                return sendTrackingEvent(orderId, "PICKED_UP", RESTAURANT_LAT, RESTAURANT_LNG, destLat, destLng, state.getDriverIdStr()).then();
            }

            // Calcular nueva posición (moviéndose un fraction del camino al restaurante)
            double newLat = state.getCurrentLat() + (RESTAURANT_LAT - state.getCurrentLat()) * movementFraction;
            double newLng = state.getCurrentLng() + (RESTAURANT_LNG - state.getCurrentLng()) * movementFraction;

            state.setCurrentLat(newLat);
            state.setCurrentLng(newLng);

            log.info("📍 Driver {} en camino al restaurante para pedido {}: ({}, {}) → {} km para restaurante",
                    state.getDriverIdStr(), orderId, String.format("%.6f", newLat), String.format("%.6f", newLng), String.format("%.4f", distanceToRestaurant));

            return sendTrackingEvent(orderId, "DRIVER_ARRIVING", newLat, newLng, RESTAURANT_LAT, RESTAURANT_LNG, state.getDriverIdStr()).then();
        }

        // FASE 2: Restaurante -> Cliente
        double distanceToCustomer = haversine(state.getCurrentLat(), state.getCurrentLng(), destLat, destLng);

        // Verificar si ya llegó (distancia < 50 metros)
        if (distanceToCustomer < 0.05) {
            log.info("🎉 ¡Pedido {} llegó a su destino final! ({} km restantes)", orderId, String.format("%.4f", distanceToCustomer));
            activeSimulations.remove(orderId);
            return markAsDelivered(orderId, destLat, destLng, state.getDriverIdStr());
        }

        // Calcular nueva posición (moviéndose un fraction del camino al cliente)
        double newLat = state.getCurrentLat() + (destLat - state.getCurrentLat()) * movementFraction;
        double newLng = state.getCurrentLng() + (destLng - state.getCurrentLng()) * movementFraction;

        state.setCurrentLat(newLat);
        state.setCurrentLng(newLng);

        log.info("📍 Driver {} en camino al cliente para pedido {}: ({}, {}) → {} km para destino",
                state.getDriverIdStr(), orderId, String.format("%.6f", newLat), String.format("%.6f", newLng), String.format("%.4f", distanceToCustomer));

        return sendTrackingEvent(orderId, "EN_CAMINO", newLat, newLng, destLat, destLng, state.getDriverIdStr()).then();
    }

    private Mono<String> sendTrackingEvent(Long orderId, String status, double lat, double lng, double deliveryLat,
            double deliveryLng, String driverIdStr) {
        OrderStatusEvent event = new OrderStatusEvent(
                orderId,
                status,
                driverIdStr,
                LocalDateTime.now(),
                lat,
                lng,
                deliveryLat,
                deliveryLng);

        kafkaProducerService.sendStatusUpdate(event);
        return Mono.just("Evento enviado");
    }

    private Mono<Void> markAsDelivered(Long orderId, double finalLat, double finalLng, String driverIdStr) {
        log.info("✅ Enviando evento FINAL de entrega para pedido {}", orderId);

        OrderStatusEvent event = new OrderStatusEvent(
                orderId,
                "ENTREGADO",
                driverIdStr,
                LocalDateTime.now(),
                finalLat,
                finalLng,
                finalLat,
                finalLng);

        kafkaProducerService.sendStatusUpdate(event);

        // Actualizar base de datos MySQL/PostgreSQL
        return Mono.fromCallable(() -> {
            orderRepository.findById(orderId).ifPresent(order -> {
                order.setStatus(OrderStatus.ENTREGADO);
                order.setDeliveredAt(LocalDateTime.now());
                orderRepository.save(order);
                log.info("✅ Orden {} marcada como ENTREGADA en base de datos", orderId);
                if (order.getDriverId() != null) {
                    try {
                        driverClient.incrementDeliveries(order.getDriverId());
                        log.info("✅ Entregas incrementadas y disponibilidad de conductor reseteada para ID: {}", order.getDriverId());
                    } catch (Exception e) {
                        log.error("Error al actualizar entregas del conductor", e);
                    }
                }
            });
            return (Void) null;
        }).subscribeOn(Schedulers.boundedElastic()).then();
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
