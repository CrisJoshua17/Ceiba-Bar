package com.project.micro_drivers.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;


import com.project.micro_drivers.model.Driver;
import com.project.micro_drivers.model.dto.UserDto;
import com.project.micro_drivers.service.DriverServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequestMapping("/api/drivers")
@Log4j2
@RequiredArgsConstructor
public class DriverController {

    private final DriverServiceImpl service;

    @GetMapping
    public ResponseEntity<?> findAll() {
        Map<String, Object> response = new HashMap<>();
        List<Driver> drivers = service.findAll();
        try {
            response.put("success", true);
            response.put("message", "Drivers obtenidos exitosamente");
            response.put("data", drivers);
            response.put("timestamp", LocalDateTime.now());
            response.put("count", drivers.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener los drivers ");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

    }

    @GetMapping("/{driverId}")
    public ResponseEntity<?> findById(@PathVariable Long driverId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Driver> driver = service.findById(driverId);
            response.put("success", true);
            response.put("message", "Driver obtenido exitosamente");
            response.put("data", driver);
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener el driver");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PostMapping
    public ResponseEntity<?> saveDriver(@Valid @RequestBody Driver driver) {
        Map<String, Object> response = new HashMap<>();
        try {
            Driver driverSave = service.createDriver(driver);
            response.put("success", true);
            response.put("message", "Driver creado exitosamente");
            response.put("data", driverSave);
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al crear el driver");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PutMapping("/{driverId}")
    public ResponseEntity<?> updateUser(@PathVariable Long driverId, @Valid @RequestBody Driver driver) {
        Map<String, Object> response = new HashMap<>();
        try {
            Driver updatedDriver = service.update(driver);
            response.put("success", true);
            response.put("message", "Driver actualizado exitosamente");
            response.put("data", updatedDriver);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar el Driver");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{driverId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long driverId) {
        Map<String, Object> response = new HashMap<>();
        try {
            service.delete(driverId);

            response.put("success", true);
            response.put("message", "Driver eliminado exitosamente");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar el Driver");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PostMapping("/internal/create")
    public ResponseEntity<?> createDriverProfile(@RequestParam String userId,
            @RequestParam String userEmail) {
        try {
            log.info("Creando perfil automático para driver: {} (ID: {})", userEmail, userId);

            Optional<Driver> existingDriver = service.findByUserId(userId);
            if (existingDriver.isPresent()) {
                log.warn("Ya existe un driver para el usuario ID: {}", userId);
                return ResponseEntity.ok(existingDriver.get()); // ← Devuelve el driver existente
            }

            Driver driver = new Driver();
            driver.setUserId(userId);
            driver.setUserEmail(userEmail);
            driver.setRegistrationDate(LocalDateTime.now());
            driver.setRating(0.0);
            driver.setTotalDeliveries(0);

            Driver savedDriver = service.save(driver);
            log.info("Perfil de driver creado exitosamente para ID: {}", userId);
            return ResponseEntity.ok(savedDriver);

        } catch (Exception e) {
            log.error("Error creando perfil automático: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/my-profile")
    public ResponseEntity<?> getMyProfile() {
        Map<String, Object> response = new HashMap<>();
        try {
            var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) authentication.getPrincipal();
            String userId = jwt.getSubject();

            // ✅ BUSCAR PERFIL DE DRIVER
            Driver driver = service.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Perfil de driver no encontrado"));

            response.put("success", true);
            response.put("message", "Perfil obtenido exitosamente");
            response.put("data", driver);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener el perfil: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === ACTUALIZAR MI PERFIL ===
    @PutMapping("/my-profile")
    public ResponseEntity<?> updateMyProfile(@Valid @RequestBody Driver driverUpdate) {
        Map<String, Object> response = new HashMap<>();
        try {
            var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) authentication.getPrincipal();
            String userId = jwt.getSubject();

            Driver existingDriver = service.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Perfil de driver no encontrado"));

            // ✅ACTUALIZAR CAMPOS PERMITIDOS (no userId ni email)
            existingDriver.setMotoId(driverUpdate.getMotoId());
            existingDriver.setLicensePlate(driverUpdate.getLicensePlate());
            existingDriver.setLicenseNumber(driverUpdate.getLicenseNumber());

            Driver updatedDriver = service.update(existingDriver);

            response.put("success", true);
            response.put("message", "Perfil actualizado exitosamente");
            response.put("data", updatedDriver);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar el perfil: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === ENDPOINTS INTERNOS PARA COMUNICACIÓN ENTRE MICROSERVICIOS ===
    @GetMapping("/internal/user/{userId}")
    public Driver findByUserId(@PathVariable String userId) {
        return service.findByUserId(userId).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @GetMapping("/internal/{id}")
    public Driver getDriverByIdInternal(@PathVariable Long id) {
        return service.findById(id).orElseThrow(() -> new RuntimeException("Driver no encontrado con ID: " + id));
    }

    @PutMapping("/internal/{id}/increment-deliveries")
    public ResponseEntity<?> incrementDeliveriesInternal(@PathVariable Long id) {
        return incrementDeliveries(id);
    }

    /**
     * Incrementa el contador de entregas de un driver
     */
    @PutMapping("/{driverId}/increment-deliveries")
    public ResponseEntity<?> incrementDeliveries(@PathVariable Long driverId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Driver driver = service.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver no encontrado con ID: " + driverId));

            driver.setTotalDeliveries(driver.getTotalDeliveries() + 1);
            driver.setAvailable(true); // Conductor queda libre
            Driver updatedDriver = service.update(driver);
            service.tryAssignPendingOrders(); // Intentar asignar pedidos en cola

            response.put("success", true);
            response.put("message", "Contador de entregas incrementado y conductor disponible");
            response.put("data", updatedDriver);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al incrementar entregas: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Obtiene todos los drivers disponibles para asignación
     */
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableDrivers() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Driver> drivers = service.findAvailableDrivers();

            response.put("success", true);
            response.put("message", "Drivers disponibles obtenidos exitosamente");
            response.put("data", drivers);
            response.put("timestamp", LocalDateTime.now());
            response.put("count", drivers.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener drivers disponibles");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Actualiza la ubicación de un driver
     */
    @PutMapping("/{driverId}/location")
    public ResponseEntity<?> updateLocation(@PathVariable Long driverId,
            @RequestParam Double latitude,
            @RequestParam Double longitude) {
        Map<String, Object> response = new HashMap<>();
        try {
            Driver updatedDriver = service.updateLocation(driverId, latitude, longitude);
            response.put("success", true);
            response.put("message", "Ubicación del driver actualizada");
            response.put("data", updatedDriver);
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar ubicación: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Actualiza la disponibilidad de un driver
     */
    @PutMapping("/{driverId}/availability")
    public ResponseEntity<?> updateAvailability(@PathVariable Long driverId,
            @RequestParam Boolean available) {
        Map<String, Object> response = new HashMap<>();
        try {
            Driver updatedDriver = service.updateAvailability(driverId, available);
            response.put("success", true);
            response.put("message", "Disponibilidad del driver actualizada");
            response.put("data", updatedDriver);
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar disponibilidad: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

}
