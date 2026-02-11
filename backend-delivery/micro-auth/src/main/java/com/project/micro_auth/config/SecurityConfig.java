package com.project.micro_auth.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.disable()) // CORS deshabilitado (Manejado por Gateway)
                                // .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // Endpoints públicos
                                                .requestMatchers(
                                                                "/api/auth/login",
                                                                "/api/auth/validate",
                                                                "/api/auth/validate-admin",
                                                                "/api/auth/validate-token",
                                                                "/api/auth/validate-role/**",
                                                                "/api/auth/public/**",
                                                                "/api/users/register",
                                                                "/api/users/init-admin",
                                                                "/api/users/internal/**",
                                                                "/api/products/**",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/error")
                                                .permitAll()

                                                // Endpoints específicos que requieren ADMIN
                                                .requestMatchers(
                                                                "/api/users",
                                                                "/api/users/drivers",
                                                                "/api/users/admins",
                                                                "/api/users/*/image" // Específico para actualizar
                                                                                     // imagen
                                                ).hasRole("ADMIN")

                                                // Endpoints que requieren autenticación (cualquier usuario logueado)
                                                .requestMatchers(
                                                                "/api/auth/user-info",
                                                                "/api/users/profile", // Si tienes un endpoint de perfil
                                                                "/api/auth/**" // Otros endpoints de auth requieren
                                                                               // autenticación
                                                ).authenticated()

                                                // Endpoints de users por ID - más específicos
                                                .requestMatchers("/api/users/{id:^[0-9]+$}").authenticated() // Solo
                                                                                                             // números
                                                                                                             // para IDs

                                                // Cualquier otro endpoint requiere autenticación
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowCredentials(true);
                configuration.setAllowedOriginPatterns(Arrays.asList("*")); // Para desarrollo
                configuration.setAllowedHeaders(Arrays.asList(
                                "Authorization",
                                "Cache-Control",
                                "Content-Type",
                                "X-Requested-With",
                                "Accept",
                                "Origin",
                                "Access-Control-Request-Method",
                                "Access-Control-Request-Headers"));
                configuration.setAllowedMethods(Arrays.asList(
                                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
                configuration.setExposedHeaders(Arrays.asList(
                                "Authorization",
                                "Content-Disposition"));

                // Configuración específica para preflight requests
                configuration.setMaxAge(3600L); // Cache preflight por 1 hora

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}