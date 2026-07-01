package com.project.micro_gateway.config;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

        @Bean
        public GlobalFilter stripInternalApiKeyHeader() {
                return (exchange, chain) -> {
                        ServerHttpRequest request = exchange.getRequest().mutate()
                                        .headers(headers -> headers.remove("X-Internal-Api-Key"))
                                        .build();
                        return chain.filter(exchange.mutate().request(request).build());
                };
        }

        @Bean
        public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
                return builder.routes()
                                // ========== BLOCK INTERNAL ENDPOINTS FROM OUTSIDE ==========
                                .route("block-internal-users", r -> r
                                                .path("/api/users/internal/**")
                                                .filters(f -> f.setStatus(HttpStatus.FORBIDDEN))
                                                .uri("no-op://localhost"))
                                .route("block-internal-drivers", r -> r
                                                .path("/api/drivers/internal/**")
                                                .filters(f -> f.setStatus(HttpStatus.FORBIDDEN))
                                                .uri("no-op://localhost"))
                                .route("block-internal-customers", r -> r
                                                .path("/api/customers/internal/**")
                                                .filters(f -> f.setStatus(HttpStatus.FORBIDDEN))
                                                .uri("no-op://localhost"))
                                .route("block-internal-orders", r -> r
                                                .path("/api/orders/internal/**")
                                                .filters(f -> f.setStatus(HttpStatus.FORBIDDEN))
                                                .uri("no-op://localhost"))
                                .route("block-internal-deliveries", r -> r
                                                .path("/api/delivery/internal/**")
                                                .filters(f -> f.setStatus(HttpStatus.FORBIDDEN))
                                                .uri("no-op://localhost"))

                                // ========== IMAGES ROUTING (Evitar colisión de prefijos /images) ==========
                                .route("products-images", r -> r
                                                .path("/api/products/images/**")
                                                .filters(f -> f.rewritePath("/api/products/images/(?<remaining>.*)", "/images/${remaining}"))
                                                .uri("lb://micro-productos"))

                                .route("users-images", r -> r
                                                .path("/api/users/images/**")
                                                .filters(f -> f.rewritePath("/api/users/images/(?<remaining>.*)", "/images/${remaining}"))
                                                .uri("lb://micro-usuarios"))

                                // ========== PUBLIC PRODUCTS (Mover al inicio para evitar colisiones)
                                // ==========
                                .route("products-public", r -> r
                                                .path("/api/products/**")
                                                .and()
                                                .method("GET", "OPTIONS")
                                                .uri("lb://micro-productos"))

                                // ========== USERS ROUTES ==========
                                .route("users", r -> r
                                                .path("/api/users/**")
                                                .uri("lb://micro-usuarios"))

                                // ========== DRIVERS ROUTES ==========
                                .route("drivers", r -> r
                                                .path("/api/drivers/**")
                                                .uri("lb://micro-drivers"))

                                // ========== CUSTOMERS ROUTES ==========
                                .route("customers", r -> r
                                                .path("/api/customers/**")
                                                .uri("lb://micro-customer"))

                                // ========== PRODUCTS PROTECTED (POST, PUT, DELETE) ==========
                                .route("products-protected", r -> r
                                                .path("/api/products/**")
                                                .uri("lb://micro-productos"))

                                // ========== PAYMENTS ROUTES ==========
                                .route("payments", r -> r
                                                .path("/api/payments/**")
                                                .uri("lb://micro-payments"))

                                // ========== ORDERS ROUTES ==========
                                .route("orders", r -> r
                                                .path("/api/orders/**")
                                                .uri("lb://micro-realtime"))

                                // ========== DELIVERY ROUTES ==========
                                .route("delivery", r -> r
                                                .path("/api/delivery/**")
                                                .uri("lb://micro-realtime"))

                                // ========== TRACKING ROUTES ==========
                                .route("tracking", r -> r
                                                .path("/api/tracking/**")
                                                .uri("lb://micro-realtime"))

                                // ========== WEBSOCKET ROUTES (Sin autenticación por ahora) ==========
                                .route("websocket-tracking", r -> r
                                                .path("/ws/tracking")
                                                .uri("lb:ws://micro-realtime"))

                                .build();
        }
}
