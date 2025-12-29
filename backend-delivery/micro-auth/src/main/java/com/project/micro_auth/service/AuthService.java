package com.project.micro_auth.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.project.micro_auth.Feign.UserClient;
import com.project.micro_auth.model.dto.UserDto;
import com.project.micro_auth.model.dto.UserInfo;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Log4j2
public class AuthService {
    
    private final LoginAttemptService loginAttemptService;
    private final UserClient userClient;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public String login(String email, String password) {
        // Verificar si la cuenta está bloqueada
        if (loginAttemptService.isBlocked(email)) {
            long remainingTime = loginAttemptService.getBlockTimeRemaining(email);
            long minutes = remainingTime / (60 * 1000);
            throw new RuntimeException("Cuenta temporalmente bloqueada. Intente nuevamente en " + minutes + " minutos");
        }
        
        try {
            log.info("Intentando login para email: {}", email);
            
            // Buscar usuario por email usando Feign Client
            UserDto user = userClient.findByEmail(email);
            
            if (user == null) {
                log.warn("Usuario no encontrado para email: {}", email);
                loginAttemptService.loginFailed(email);
                throw new RuntimeException("Password o Usurio incorrectos");
            }
            
            log.info("Usuario encontrado: {} - {}", user.getId(), user.getEmail());
            
            // Verificar contraseña
            if (!passwordEncoder.matches(password, user.getPassword())) {
                log.warn("Contraseña incorrecta para usuario: {}", user.getEmail());
                loginAttemptService.loginFailed(email);
                int remainingAttempts = loginAttemptService.getRemainingAttempts(email);
                throw new RuntimeException("Password o Usurio incorrectos. Intentos restantes: " + remainingAttempts);
            }
            
            // Login exitoso - resetear contador de intentos
            loginAttemptService.loginSuccess(email);
            
            // Generar token JWT con roles - el rol viene como String
            List<String> roles = List.of(user.getRole().toUpperCase());
            
            String token = jwtService.generateToken(user.getEmail(), roles, user.getId());
            log.info("Token generado exitosamente para usuario: {}", user.getEmail());
            
            return token;
            
        } catch (Exception e) {
            log.error("Error en login para email {}: {}", email, e.getMessage());
            
            if (!e.getMessage().contains("Password o Usurio incorrectos")) {
                loginAttemptService.loginFailed(email);
            }
            
            throw new RuntimeException("Error en autenticación: " + e.getMessage());
        }
    }

    // Método para validar token
    public boolean validateToken(String token) {
        return jwtService.validateToken(token);
    }

    // Método para obtener información del usuario desde el token
    public UserInfo getUserInfoFromToken(String token) {
        if (!validateToken(token)) {
            throw new RuntimeException("Token inválido");
        }
        
        return UserInfo.builder()
                .email(jwtService.extractEmail(token))
                .userId(jwtService.extractUserId(token))
                .roles(jwtService.extractRoles(token))
                .build();
    }

    public boolean validateAdminToken(String token) {
        try {
            if (!validateToken(token)) {
                return false;
            }
            UserInfo userInfo = getUserInfoFromToken(token);
            return userInfo.getRoles().contains("ADMIN");
        } catch (Exception e) {
            log.error("Error validando token de ADMIN: {}", e.getMessage());
            return false;
        }
    }

    public boolean validateRoleToken(String token, String role) {
        try {
            if (!validateToken(token)) {
                return false;
            }
            UserInfo userInfo = getUserInfoFromToken(token);
            return userInfo.getRoles().contains(role.toUpperCase());
        } catch (Exception e) {
            log.error("Error validando token con rol {}: {}", role, e.getMessage());
            return false;
        }
    }
}