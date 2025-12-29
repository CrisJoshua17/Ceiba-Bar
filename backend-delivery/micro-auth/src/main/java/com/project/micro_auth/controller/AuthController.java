package com.project.micro_auth.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.micro_auth.Feign.CustomerClient;
import com.project.micro_auth.Feign.DriverClient;
import com.project.micro_auth.Feign.UserClient;
import com.project.micro_auth.model.dto.ApiResponse;
import com.project.micro_auth.model.dto.CustomerDto;
import com.project.micro_auth.model.dto.DriverDto;
import com.project.micro_auth.model.dto.FullUserDto;
import com.project.micro_auth.model.dto.LoginRequest;
import com.project.micro_auth.model.dto.UserDto;
import com.project.micro_auth.model.dto.UserFormDto;
import com.project.micro_auth.model.dto.UserInfo;
import com.project.micro_auth.service.AuthService;
import com.project.micro_auth.service.JwtService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserClient userClient;
    private final DriverClient driverClient;
    private final CustomerClient customerClient;

    // === MÉTODO AUXILIAR PARA EXTRAER TOKEN ===
    private String extractToken(String authHeader) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new IllegalArgumentException("Authorization header is required");
        }

        if (authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Si no tiene "Bearer ", asumimos que es el token directamente
        return authHeader;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            // Validaciones básicas
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                response.setSuccess(false);
                response.setMessage("El email es requerido");
                response.setTimestamp(LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                response.setSuccess(false);
                response.setMessage("La contraseña es requerida");
                response.setTimestamp(LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            String token = authService.login(request.getEmail(), request.getPassword());

            response.setSuccess(true);
            response.setMessage("Login exitoso");
            response.setData(token);
            response.setTimestamp(LocalDateTime.now());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            response.setTimestamp(LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.OK).body(response);
        }
    }

    // === VALIDAR TOKEN DE ADMIN ===
    @PostMapping("/validate-admin")
    public ResponseEntity<ApiResponse<Boolean>> validateAdminToken(
            @RequestHeader("Authorization") String authHeader) {

        String token = extractToken(authHeader);
        boolean isAdmin = authService.validateToken(token) &&
                authService.validateRoleToken(token, "ADMIN");

        ApiResponse<Boolean> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setData(isAdmin);
        response.setMessage(isAdmin ? "Token de ADMIN válido" : "Token inválido o sin permisos");
        response.setTimestamp(LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    // === VALIDAR TOKEN CON ROL ESPECÍFICO ===
    @PostMapping("/validate-role/{role}")
    public ResponseEntity<?> validateRole(@RequestHeader("Authorization") String authHeader,
            @PathVariable String role) {
        ApiResponse<Boolean> response = new ApiResponse<>();
        try {
            String token = extractToken(authHeader);

            if (role == null || role.trim().isEmpty()) {
                response.setSuccess(false);
                response.setMessage("El rol es requerido");
                response.setData(false);
                response.setTimestamp(LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            boolean isValid = authService.validateToken(token) &&
                    authService.getUserInfoFromToken(token).getRoles().contains(role.toUpperCase());

            response.setSuccess(true);
            response.setMessage(isValid ? "Token con rol " + role + " válido" : "Token inválido o sin rol " + role);
            response.setData(isValid);
            response.setTimestamp(LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            response.setData(false);
            response.setTimestamp(LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("Error validando token con rol " + role);
            response.setData(false);
            response.setTimestamp(LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // PÚBLICO - Validar token
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestBody Map<String, String> request) {
        ApiResponse<Boolean> response = new ApiResponse<>();
        try {
            String token = request.get("token");

            if (token == null || token.trim().isEmpty()) {
                response.setSuccess(false);
                response.setMessage("El token es requerido");
                response.setData(false);
                response.setTimestamp(LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            boolean isValid = authService.validateToken(token);

            response.setSuccess(true);
            response.setMessage(isValid ? "Token válido" : "Token inválido");
            response.setData(isValid);
            response.setTimestamp(LocalDateTime.now());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("Error validando token");
            response.setData(false);
            response.setTimestamp(LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // AUTENTICADO - Cualquier usuario logueado
    @GetMapping("/user-info")
    public ResponseEntity<ApiResponse<FullUserDto>> getUserInfo(
            @RequestHeader("Authorization") String authHeader) {

        ApiResponse<FullUserDto> response = new ApiResponse<>();

        try {
            String token = extractToken(authHeader);
            UserInfo info = authService.getUserInfoFromToken(token);

            FullUserDto full = new FullUserDto();

            // 1. Datos base del usuario
            UserDto userDto = userClient.findByEmail(info.getEmail());
            UserFormDto userResponse = convertToUserResponseDto(userDto);
            full.setUser(userResponse);

            // 2. Dependiendo del rol, obtener extras
            switch (userResponse.getRole()) {
                case "DRIVER":
                    full.setDriver(driverClient.findByUserId(userResponse.getId()));
                    break;

                case "CUSTOMER":
                    full.setCustomer(customerClient.findByUserId(userResponse.getId()));
                    break;

                default:
                    break;
            }

            response.ok("Información obtenida", full);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.error("Error obteniendo información del usuario");
            return ResponseEntity.badRequest().body(response);
        }
    }

    // === ENDPOINT ADICIONAL: VALIDAR TOKEN SIMPLE ===
    @PostMapping("/validate-token")
    public ResponseEntity<?> validateTokenHeader(@RequestHeader("Authorization") String authHeader) {
        ApiResponse<Boolean> response = new ApiResponse<>();
        try {
            String token = extractToken(authHeader);
            boolean isValid = authService.validateToken(token);

            response.setSuccess(true);
            response.setMessage(isValid ? "Token válido" : "Token inválido");
            response.setData(isValid);
            response.setTimestamp(LocalDateTime.now());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            response.setData(false);
            response.setTimestamp(LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("Error validando token");
            response.setData(false);
            response.setTimestamp(LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // SOLO ADMIN
    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminDashboard() {
        ApiResponse<String> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Bienvenido al dashboard de ADMIN");
        response.setData("Acceso concedido a recursos administrativos");
        response.setTimestamp(LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    // SOLO DRIVER
    @GetMapping("/driver/profile")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> driverProfile() {
        ApiResponse<String> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Perfil de DRIVER");
        response.setData("Información específica para drivers");
        response.setTimestamp(LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    // SOLO CONSUMER
    @GetMapping("/consumer/orders")
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<?> consumerOrders() {
        ApiResponse<String> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Pedidos de CONSUMER");
        response.setData("Historial de pedidos del consumidor");
        response.setTimestamp(LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    // ADMIN O DRIVER
    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<?> getReports() {
        ApiResponse<String> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Reportes del sistema");
        response.setData("Reportes accesibles para ADMIN y DRIVER");
        response.setTimestamp(LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    private UserFormDto convertToUserResponseDto(UserDto userDto) {
        UserFormDto responseDto = new UserFormDto();
        responseDto.setId(userDto.getId());
        responseDto.setName(userDto.getName());
        responseDto.setLastName(userDto.getLastName());
        responseDto.setEmail(userDto.getEmail());
        responseDto.setRole(userDto.getRole());
        responseDto.setPhone(userDto.getPhone());
        responseDto.setImage(userDto.getImage());
        // NO copiamos el password
        return responseDto;
    }
}