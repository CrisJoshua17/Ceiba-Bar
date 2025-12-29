package com.project.micro_auth.config;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.project.micro_auth.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Component
@RequiredArgsConstructor
@Log4j2
public class JwtAuthenticationFilter  extends OncePerRequestFilter{
    
     private final JwtService jwtService;
    
    
    
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
    
          try {
            String token = extractToken(request);
            
            if (token != null && jwtService.validateToken(token)) {
                String email = jwtService.extractEmail(token);
                Long userId = jwtService.extractUserId(token);
                List<String> roles = jwtService.extractRoles(token);
                
                // Convertir roles a autoridades de Spring Security
                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());
                
                // Crear autenticación
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(email, null, authorities);
                
                // Agregar userId como detalle adicional
                authentication.setDetails(userId);
                
                // Establecer en el contexto de seguridad
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                log.debug("Usuario autenticado: {} con roles: {}", email, roles);
            }
        } catch (Exception e) {
            log.error("Error en JWT Authentication Filter: {}", e.getMessage());
            // No limpiar el contexto para permitir otros filtros
        }
        
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
    
    
}
