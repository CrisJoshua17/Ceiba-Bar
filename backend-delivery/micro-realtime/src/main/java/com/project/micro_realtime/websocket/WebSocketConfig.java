package com.project.micro_realtime.websocket;

import java.util.HashMap;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import com.project.micro_realtime.websocket.config.TrackingWebSocketHandler;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class WebSocketConfig {

    private final TrackingWebSocketHandler handler;

    // Registra tus endpoints WebSocket de forma reactiva
    @Bean
    public SimpleUrlHandlerMapping webSocketMapping() {
        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put("/ws/tracking", handler);// asigna endpoint

        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setOrder(10);
        mapping.setUrlMap(map);
        return mapping;
    }

    // es obligatorio en WebFlux para que Spring sepa cómo manejar WebSocketHandler
    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter();
    }

}
