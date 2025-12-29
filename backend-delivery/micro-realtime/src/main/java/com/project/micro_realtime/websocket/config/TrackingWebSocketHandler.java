package com.project.micro_realtime.websocket.config;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_realtime.model.OrderTracking;
import com.project.micro_realtime.repository.TrackingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

@Component
@RequiredArgsConstructor
@Log4j2
public class TrackingWebSocketHandler implements WebSocketHandler {

    private final TrackingRepository trackingRepository;
    private final ObjectMapper objectMapper;
    private final Map<String, Sinks.Many<OrderTracking>> sinks = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String query = session.getHandshakeInfo().getUri().getQuery();
        if (query == null || !query.startsWith("orderId=")) {
            return session.close();
        }

        String orderIdStr = query.split("=")[1];
        Long orderId = Long.parseLong(orderIdStr);

        log.info("🔌 Nueva conexión WebSocket para orderId: {}", orderId);

        Sinks.Many<OrderTracking> sink = Sinks.many().multicast().onBackpressureBuffer();
        sinks.put(session.getId(), sink);

        // Enviar la última posición al conectar
        trackingRepository.findTopByOrderIdOrderByTimestampDesc(orderId)
                .doOnSuccess(lastPosition -> {
                    if (lastPosition != null) {
                        log.info("📤 Enviando última posición al cliente: {}", lastPosition);
                        sink.tryEmitNext(lastPosition);
                    }
                })
                .subscribe();

        Flux<String> output = sink.asFlux()
                .map(this::toJson)
                .doOnError(error -> log.error("Error sending WebSocket message", error));

        return session.send(output.map(session::textMessage))
                .and(session.receive().doOnNext(message -> {
                    // Opcional: manejar mensajes del cliente
                    log.info("📥 Mensaje recibido del cliente: {}", message.getPayloadAsText());
                }).then())
                .doFinally(signal -> {
                    log.info("🔌 Cerrando conexión WebSocket para orderId: {}", orderId);
                    sinks.remove(session.getId());
                    sink.tryEmitComplete();
                });
    }

    @Scheduled(fixedRate = 3000)
    public void broadcastLatest() {
        if (sinks.isEmpty()) {
            return;
        }

        log.info("📡 Broadcast de últimas posiciones - Clientes conectados: {}", sinks.size());

        // Obtener solo los trackings más recientes por orderId
        trackingRepository.findAll()
                .collectList()
                .doOnSuccess(allTrackings -> {
                    if (allTrackings.isEmpty()) {
                        return;
                    }

                    // Agrupar por orderId y tomar el más reciente de cada uno
                    Map<Long, OrderTracking> latestByOrderId = allTrackings.stream()
                            .collect(Collectors.toMap(
                                    OrderTracking::getOrderId,
                                    Function.identity(),
                                    (existing, replacement) -> existing.getTimestamp()
                                            .isAfter(replacement.getTimestamp()) ? existing : replacement));

                    // Enviar solo trackings recientes (últimos 2 minutos)
                    LocalDateTime twoMinutesAgo = LocalDateTime.now().minusMinutes(2);

                    latestByOrderId.values().stream()
                            .filter(tracking -> tracking.getTimestamp().isAfter(twoMinutesAgo))
                            .forEach(tracking -> {
                                sinks.values().forEach(sink -> {
                                    if (sink.currentSubscriberCount() > 0) {
                                        log.info(
                                                "📤 Enviando actualización para orderId: {} - Estado: {} - Posición: ({}, {})",
                                                tracking.getOrderId(), tracking.getStatus(), tracking.getLat(),
                                                tracking.getLng());
                                        sink.tryEmitNext(tracking);
                                    }
                                });
                            });

                    log.info("✅ Broadcast completado - Trackings recientes enviados: {}",
                            latestByOrderId.values().stream()
                                    .filter(tracking -> tracking.getTimestamp().isAfter(twoMinutesAgo))
                                    .count());
                })
                .doOnError(error -> log.error("❌ Error en broadcastLatest", error))
                .subscribe();
    }

    private String toJson(OrderTracking tracking) {
        try {
            return objectMapper.writeValueAsString(tracking);
        } catch (Exception e) {
            log.error("Error serializando OrderTracking a JSON", e);
            return "{}";
        }
    }
}