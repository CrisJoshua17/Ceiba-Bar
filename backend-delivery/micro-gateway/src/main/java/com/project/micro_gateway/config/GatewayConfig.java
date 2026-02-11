package com.project.micro_gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

        @Bean
        public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
                return builder.routes()
                                // ========== PUBLIC PRODUCTS (Mover al inicio para evitar colisiones)
                                // ==========
                                .route("products-public", r -> r
                                                .path("/api/products/**")
                                                .and()
                                                .method("GET", "OPTIONS")
                                                .uri("lb://micro-productos"))

                                // ========== AUTH ROUTES (No requieren validación) ==========
                                .route("auth-login", r -> r
                                                .path("/api/auth/login")
                                                .uri("lb://micro-auth"))

                                .route("auth-register", r -> r
                                                .path("/api/auth/register")
                                                .uri("lb://micro-auth"))

                                .route("auth-validate", r -> r
                                                .path("/api/auth/validate")
                                                .uri("lb://micro-auth"))

                                // ========== AUTH ROUTES (Requieren validación) ==========
                                .route("auth-protected", r -> r
                                                .path("/api/auth/**")
                                                .filters(f -> f.filter(new AuthenticationFilter()))
                                                .uri("lb://micro-auth"))

                                // ========== USERS ROUTES ==========
                                .route("users", r -> r
                                                .path("/api/users/**")
                                                .filters(f -> f.filter(new AuthenticationFilter()))
                                                .uri("lb://micro-usuarios"))

                                // ========== DRIVERS ROUTES ==========
                                .route("drivers", r -> r
                                                .path("/api/drivers/**")
                                                .filters(f -> f.filter(new AuthenticationFilter()))
                                                .uri("lb://micro-drivers"))

                                // ========== CUSTOMERS ROUTES ==========
                                .route("customers", r -> r
                                                .path("/api/customers/**")
                                                .filters(f -> f.filter(new AuthenticationFilter()))
                                                .uri("lb://micro-customer"))

                                // ========== PRODUCTS PROTECTED (POST, PUT, DELETE) ==========
                                .route("products-protected", r -> r
                                                .path("/api/products/**")
                                                .filters(f -> f.filter(new AuthenticationFilter()))
                                                .uri("lb://micro-productos"))

                                // ========== PAYMENTS ROUTES ==========
                                .route("payments", r -> r
                                                .path("/api/payments/**")
                                                .filters(f -> f.filter(new AuthenticationFilter()))
                                                .uri("lb://micro-payments"))

                                // ========== ORDERS ROUTES ==========
                                .route("orders", r -> r
                                                .path("/api/orders/**")
                                                .filters(f -> f.filter(new AuthenticationFilter()))
                                                .uri("lb://micro-realtime"))

                                // ========== DELIVERY ROUTES ==========
                                .route("delivery", r -> r
                                                .path("/api/delivery/**")
                                                .filters(f -> f.filter(new AuthenticationFilter()))
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
