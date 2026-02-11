package com.project.micro_realtime.websocket.config;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;

import com.fasterxml.jackson.core.JsonProcessingException;
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

    // Mapa: OrderId -> Sink (Canal de difusión para esa orden)
    // Sinks.Many permite múltiples suscriptores (multicast)
    private final Map<Long, Sinks.Many<OrderTracking>> orderSinks = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String query = session.getHandshakeInfo().getUri().getQuery();
        if (query == null || !query.contains("orderId=")) {
            return session.close();
        }

        // Extraer orderId de la query string (formato simple)
        String orderIdStr = query.split("orderId=")[1].split("&")[0];
        Long orderId;
        try {
            orderId = Long.parseLong(orderIdStr);
        } catch (NumberFormatException e) {
            return session.close();
        }

        log.info("🔌 Nuevo cliente conectado a tracking de Orden ID: {}", orderId);

        // Obtener o crear el Sink para este orderId
        Sinks.Many<OrderTracking> sink = orderSinks.computeIfAbsent(orderId, id -> {
            log.info("📢 Creando nuevo canal de difusión para Orden ID: {}", id);
            return Sinks.many().multicast().onBackpressureBuffer();
        });

        // Flujo de mensajes para este cliente
        Flux<String> updatesFlux = sink.asFlux()
                .map(this::toJson)
                .doOnNext(json -> log.debug("📤 Enviando a cliente (Orden {}): {}", orderId, json));

        // Enviar la última posición conocida inmediatamente al conectar
        Mono<Void> sendInitialPosition = trackingRepository.findTopByOrderIdOrderByTimestampDesc(orderId)
                .flatMap(last -> {
                    try {
                        String json = objectMapper.writeValueAsString(last);
                        return session.send(Mono.just(session.textMessage(json)));
                    } catch (JsonProcessingException e) {
                        return Mono.error(e);
                    }
                }).then();

        // Mantener la sesión abierta y enviar actualizaciones
        return sendInitialPosition.then(
                session.send(updatesFlux.map(session::textMessage))
                        .and(session.receive()
                                .doOnNext(msg -> log.debug("Mensaje recibido (ignorado): {}", msg.getPayloadAsText()))
                                .then())
                        .doFinally(signal -> {
                            log.info("🔌 Cliente desconectado de Orden ID: {}", orderId);
                            // No removemos el sink inmediatamente para permitir reconexiones rápidas
                            // o múltiples clientes. Podría limpiarse con un job programado si queda vacío
                            // mucho tiempo.
                        }));
    }

    /**
     * Método público llamado por KafkaConsumerService cuando llega un nuevo evento.
     * Envía la actualización solo a los clientes suscritos a ese orderId.
     */
    public void sendUpdate(OrderTracking tracking) {
        if (tracking == null || tracking.getOrderId() == null)
            return;

        Sinks.Many<OrderTracking> sink = orderSinks.get(tracking.getOrderId());
        if (sink != null) {
            // Emitir el nuevo tracking a todos los suscriptores de este orderId
            Sinks.EmitResult result = sink.tryEmitNext(tracking);

            if (result.isFailure()) {
                log.warn("⚠️ Fallo al emitir actualización para Orden {}: {}", tracking.getOrderId(), result);
            } else {
                log.info("🚀 Actualización enviada a suscriptores de Orden {}: ({}, {})",
                        tracking.getOrderId(), tracking.getLat(), tracking.getLng());
            }
        } else {
            log.debug("📭 Recibido update para Orden {}, pero no hay clientes conectados.", tracking.getOrderId());
        }
    }

    /**
     * Verifica si una orden tiene suscriptores activos (WebSocket conectados).
     */
    public boolean hasActiveSubscribers(Long orderId) {
        Sinks.Many<OrderTracking> sink = orderSinks.get(orderId);
        return sink != null && sink.currentSubscriberCount() > 0;
    }

    private String toJson(OrderTracking tracking) {
        try {
            return objectMapper.writeValueAsString(tracking);
        } catch (Exception e) {
            log.error("Error serializando tracking", e);
            return "{}";
        }
    }
}