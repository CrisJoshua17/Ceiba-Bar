package com.project.micro_realtime.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .authorizeExchange(auth -> auth
                        // --- ENDPOINTS PÚBLICOS ---
                        .pathMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .pathMatchers("/ws/tracking/**").permitAll() // WebSocket de tracking en tiempo real
                        .pathMatchers("/api/tracking/**").permitAll() // Coordenadas básicas para la UI
                        .pathMatchers(HttpMethod.GET, "/api/orders/{id}/verify").permitAll() // Verificación por email del simulador/tracking
                        .pathMatchers("/api/orders/internal/**").permitAll() // Validado por InternalApiKeyFilter
                        .pathMatchers("/api/delivery/internal/**").permitAll() // Validado por InternalApiKeyFilter
                        
                        // --- ROL ADMIN ---
                        .pathMatchers(HttpMethod.DELETE, "/api/orders/**").hasRole("ADMIN")
                        .pathMatchers("/api/delivery/assign").hasRole("ADMIN")
                        
                        // --- ROL ADMIN & DRIVER ---
                        .pathMatchers(HttpMethod.GET, "/api/orders/all").hasAnyRole("ADMIN", "DRIVER")
                        .pathMatchers(HttpMethod.GET, "/api/orders/status/**").hasAnyRole("ADMIN", "DRIVER")
                        .pathMatchers(HttpMethod.PUT, "/api/orders/**").hasAnyRole("ADMIN", "DRIVER")
                        .pathMatchers(HttpMethod.POST, "/api/orders/{id}/next").hasAnyRole("ADMIN", "DRIVER")
                        
                        .pathMatchers(HttpMethod.PUT, "/api/delivery/{id}/start").hasAnyRole("ADMIN", "DRIVER")
                        .pathMatchers(HttpMethod.PUT, "/api/delivery/{id}/complete").hasAnyRole("ADMIN", "DRIVER")
                        .pathMatchers(HttpMethod.PUT, "/api/delivery/{id}/cancel").hasAnyRole("ADMIN", "DRIVER")
                        .pathMatchers(HttpMethod.GET, "/api/delivery/driver/**").hasAnyRole("ADMIN", "DRIVER")
                        
                        // --- USUARIOS AUTENTICADOS (CUSTOMER, DRIVER, ADMIN) ---
                        .pathMatchers("/api/orders/**").authenticated()
                        .pathMatchers("/api/delivery/**").authenticated()
                        
                        // --- MONITOREO / ACTUATOR SENSITIVO ---
                        .pathMatchers("/actuator/**").hasRole("ADMIN")
                        
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new ReactiveJwtAuthenticationConverterAdapter(keycloakJwtConverter())))
                );
        return http.build();
    }

    private JwtAuthenticationConverter keycloakJwtConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null) return List.of();
            List<String> roles = (List<String>) realmAccess.get("roles");
            if (roles == null) return List.of();
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        });
        return converter;
    }
}
