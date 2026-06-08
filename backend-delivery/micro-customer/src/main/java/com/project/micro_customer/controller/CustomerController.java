package com.project.micro_customer.controller;

import java.sql.Driver;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


import com.project.micro_customer.model.Address;
import com.project.micro_customer.model.Customer;
import com.project.micro_customer.service.CustomerServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Log4j2
public class CustomerController {

    private final CustomerServiceImpl customerService;

    // === ENDPOINTS PARA CUSTOMERS (su propio perfil) ===

    // CREAR PERFIL DE CUSTOMER
    @PostMapping("/register")
    public ResponseEntity<?> registerCustomer() {
        Map<String, Object> response = new HashMap<>();
        try {
            var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) authentication.getPrincipal();
            String userId = jwt.getSubject();
            String userEmail = jwt.getClaimAsString("email");

            // Verificar que no tenga perfil ya
            if (customerService.findByUserId(userId).isPresent()) {
                return errorResponse(response, "Ya existe un perfil para este usuario", HttpStatus.BAD_REQUEST);
            }

            // Crear perfil
            Customer customer = new Customer();
            customer.setUserId(userId);
            customer.setUserEmail(userEmail);
            customer.setMemberSince(LocalDateTime.now());

            Customer savedCustomer = customerService.save(customer);

            return successResponse(response, "Perfil de customer creado exitosamente", savedCustomer,
                    HttpStatus.CREATED);

        } catch (Exception e) {
            return errorResponse(response, "Error al crear perfil: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // OBTENER MI PERFIL
    @GetMapping("/my-profile")
    public ResponseEntity<?> getMyProfile() {
        Map<String, Object> response = new HashMap<>();
        try {
            String userId = getUserIdFromToken();
            Customer customer = customerService.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Perfil de customer no encontrado"));

            return successResponse(response, "Perfil obtenido exitosamente", customer);

        } catch (RuntimeException e) {
            return errorResponse(response, e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse(response, "Error al obtener el perfil", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // VER MIS DIRECCES
    @GetMapping("/my-profile/addresses")
    public ResponseEntity<?> getMyAddresses() {
        Map<String, Object> response = new HashMap<>();
        try {
            String userId = getUserIdFromToken();
            Customer existingCustomer = customerService.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Perfil de customer no encontrado"));
            List<Address> addresses = existingCustomer.getAddresses();

            return successResponse(response, "Direcciones obtenidas exitosamente", addresses);

        } catch (RuntimeException e) {
            return errorResponse(response, e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse(response, "Error al obtener direcciones: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ACTUALIZAR MIS DIRECCES
    @PutMapping("/my-profile/addresses")
    public ResponseEntity<?> updateMyAddresses(@RequestBody List<Address> addresses) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userId = getUserIdFromToken();
            Customer existingCustomer = customerService.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Perfil de customer no encontrado"));

            // Actualizar direcciones
            existingCustomer.setAddresses(addresses);

            Customer updatedCustomer = customerService.update(existingCustomer);

            return successResponse(response, "Direcciones actualizadas exitosamente", updatedCustomer);

        } catch (RuntimeException e) {
            return errorResponse(response, e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse(response, "Error al actualizar direcciones: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    // AGREGAR UNA DIRECCIÓN
    @PostMapping("/my-profile/addresses")
    public ResponseEntity<?> addAddress(@RequestBody Address newAddress) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userId = getUserIdFromToken();
            Customer customer = customerService.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Perfil de customer no encontrado"));

            // Validación básica
            if (newAddress.getIsDefault() != null && newAddress.getIsDefault()) {
                // Si es default, quitar default de las otras
                customer.getAddresses().forEach(a -> a.setIsDefault(false));
            }

            customer.getAddresses().add(newAddress);
            customerService.update(customer); // No necesitas el retorno si no lo usas

            // Devuelve SOLO las direcciones actualizadas
            List<Address> updatedAddresses = customer.getAddresses();

            return successResponse(response, "Dirección agregada exitosamente", updatedAddresses);

        } catch (RuntimeException e) {
            return errorResponse(response, e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("Error agregando dirección", e);
            return errorResponse(response, "Error al agregar dirección: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ELIMINAR UNA DIRECCIÓN
    @DeleteMapping("/my-profile/addresses")
    public ResponseEntity<?> removeAddress(@RequestBody Address addressToRemove) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userId = getUserIdFromToken();
            Customer customer = customerService.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Perfil de customer no encontrado"));

            // Buscar y eliminar la dirección por sus propiedades
            boolean removed = customer.getAddresses()
                    .removeIf(address -> address.getAlias().equals(addressToRemove.getAlias()) &&
                            address.getStreet().equals(addressToRemove.getStreet()) &&
                            address.getPostalCode().equals(addressToRemove.getPostalCode()));

            if (!removed) {
                return errorResponse(response, "Dirección no encontrada", HttpStatus.NOT_FOUND);
            }

            Customer updatedCustomer = customerService.update(customer);
            return successResponse(response, "Dirección eliminada exitosamente", updatedCustomer);

        } catch (RuntimeException e) {
            return errorResponse(response, e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse(response, "Error al eliminar dirección: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ELIMINAR MI PERFIL
    @DeleteMapping("/my-profile")
    public ResponseEntity<?> deleteMyProfile() {
        Map<String, Object> response = new HashMap<>();
        try {
            String userId = getUserIdFromToken();
            Customer existingCustomer = customerService.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Perfil de customer no encontrado"));

            customerService.delete(existingCustomer.getId());

            return successResponse(response, "Perfil eliminado exitosamente", null);

        } catch (RuntimeException e) {
            return errorResponse(response, e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse(response, "Error al eliminar el perfil", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // === ENDPOINTS PARA ADMIN (protegidos) ===

    // LISTAR TODOS LOS CUSTOMERS (solo admin)
    @GetMapping
    public ResponseEntity<?> findAll() {
        Map<String, Object> response = new HashMap<>();
        try {

            List<Customer> customers = customerService.findAll();

            return successResponse(response, "Clientes obtenidos exitosamente", customers);

        } catch (Exception e) {
            return errorResponse(response, "Error al obtener los clientes: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // OBTENER CUSTOMER POR ID (solo admin)
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {

            Optional<Customer> optionalCustomer = customerService.findById(id);
            if (optionalCustomer.isEmpty()) {
                return errorResponse(response, "Cliente no encontrado", HttpStatus.NOT_FOUND);
            }

            return successResponse(response, "Cliente obtenido exitosamente", optionalCustomer.get());

        } catch (Exception e) {
            return errorResponse(response, "Error al obtener el cliente: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // CREAR CUSTOMER (solo admin - para casos especiales)
    @PostMapping
    public ResponseEntity<?> saveCustomer(@RequestBody Customer customer) {
        Map<String, Object> response = new HashMap<>();
        try {

            Customer customerSave = customerService.save(customer);
            return successResponse(response, "Cliente guardado exitosamente", customerSave, HttpStatus.CREATED);

        } catch (Exception e) {
            return errorResponse(response, "Error al guardar el cliente: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ACTUALIZAR CUSTOMER (solo admin)
    @PutMapping("/{customerId}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long customerId,
            @RequestBody Customer customer) {
        Map<String, Object> response = new HashMap<>();
        try {

            // Asegurar que el ID del path coincida con el del body
            if (!customerId.equals(customer.getId())) {
                return errorResponse(response, "ID del path no coincide con el body", HttpStatus.BAD_REQUEST);
            }

            Customer updatedCustomer = customerService.update(customer);
            return successResponse(response, "Cliente actualizado exitosamente", updatedCustomer);

        } catch (Exception e) {
            return errorResponse(response, "Error al actualizar el cliente: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ELIMINAR CUSTOMER (solo admin)
    @DeleteMapping("/{customerId}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long customerId) {
        Map<String, Object> response = new HashMap<>();
        try {

            customerService.delete(customerId);
            return successResponse(response, "Cliente eliminado exitosamente", null);

        } catch (Exception e) {
            return errorResponse(response, "Error al eliminar el cliente: " + e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/internal/create")
    public ResponseEntity<?> createCustomerProfile(@RequestParam String userId,
            @RequestParam String userEmail) {
        try {
            log.info("Creando perfil automático para customer: {} (ID: {})", userEmail, userId);

            // Usar try-catch o verificación segura
            Optional<Customer> existingCustomer = customerService.findByUserId(userId);
            if (existingCustomer.isPresent()) {
                log.warn("Ya existe un customer para el usuario ID: {}", userId);
                return ResponseEntity.ok(existingCustomer.get()); // Devuelve el existente
            }

            // Crear nuevo customer solo si no existe
            Customer customer = new Customer();
            customer.setUserId(userId);
            customer.setUserEmail(userEmail);
            customer.setMemberSince(LocalDateTime.now());

            Customer savedCustomer = customerService.save(customer);
            log.info("Perfil de customer creado exitosamente para ID: {}", userId);
            return ResponseEntity.ok(savedCustomer);

        } catch (Exception e) {
            log.error("❌ Error creando perfil automático: ", e); // Stacktrace completo
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === ENDPOINTS INTERNOS PARA COMUNICACIÓN ENTRE MICROSERVICIOS ===
    @GetMapping("/internal/user/{userId}")
    public Customer findByUserId(@PathVariable String userId) {
        return customerService.findByUserId(userId).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    // === MÉTODOS AUXILIARES ===
    private String getUserIdFromToken() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }

    private ResponseEntity<?> successResponse(Map<String, Object> response, String message, Object data) {
        return successResponse(response, message, data, HttpStatus.OK);
    }

    private ResponseEntity<?> successResponse(Map<String, Object> response, String message, Object data,
            HttpStatus status) {
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.status(status).body(response);
    }

    private ResponseEntity<?> errorResponse(Map<String, Object> response, String message, HttpStatus status) {
        response.put("success", false);
        response.put("message", message);
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.status(status).body(response);
    }
}