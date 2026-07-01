package com.project.micro_realtime.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
public class InternalApiKeyFilter implements WebFilter {

    @Value("${internal.api-key:ceiba-bar-internal-secret-2026}")
    private String expectedApiKey;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        
        // Si la ruta contiene /internal/, validar la API Key interna
        if (path.contains("/internal/")) {
            String apiKeyHeader = exchange.getRequest().getHeaders().getFirst("X-Internal-Api-Key");
            
            if (apiKeyHeader == null || !apiKeyHeader.equals(expectedApiKey)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        }
        
        return chain.filter(exchange);
    }
}
