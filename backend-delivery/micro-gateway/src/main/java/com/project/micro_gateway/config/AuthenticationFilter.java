package com.project.micro_gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthenticationFilter implements GatewayFilter {

    private final WebClient.Builder webClientBuilder;

    public AuthenticationFilter() {
        this.webClientBuilder = WebClient.builder();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Permitir solicitudes OPTIONS (preflight CORS)
        if (request.getMethod().name().equals("OPTIONS")) {
            return chain.filter(exchange);
        }

        // Extraer el token del header Authorization
        String authHeader = request.getHeaders().getFirst("Authorization");

        if (authHeader == null || authHeader.trim().isEmpty()) {
            log.warn("🔒 Request sin token de autorización: {}", request.getPath());
            return onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
        }

        // Validar el token con micro-auth
        return validateToken(authHeader)
                .flatMap(isValid -> {
                    if (isValid) {
                        log.info("✅ Token válido para: {}", request.getPath());
                        return chain.filter(exchange);
                    } else {
                        log.warn("❌ Token inválido para: {}", request.getPath());
                        return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
                    }
                })
                .onErrorResume(error -> {
                    log.error("❌ Error validando token: {}", error.getMessage());
                    return onError(exchange, "Authentication service error", HttpStatus.INTERNAL_SERVER_ERROR);
                });
    }

    private Mono<Boolean> validateToken(String authHeader) {
        return webClientBuilder.build()
                .post()
                .uri("http://localhost:8095/api/auth/validate-token")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(ValidationResponse.class)
                .map(response -> response.isSuccess() && response.getData())
                .onErrorReturn(false);
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");

        String errorBody = String.format("{\"success\":false,\"message\":\"%s\"}", message);

        return response.writeWith(Mono.just(response.bufferFactory().wrap(errorBody.getBytes())));
    }

    // DTO para la respuesta de validación
    @lombok.Data
    private static class ValidationResponse {
        private boolean success;
        private String message;
        private Boolean data;
    }
}
