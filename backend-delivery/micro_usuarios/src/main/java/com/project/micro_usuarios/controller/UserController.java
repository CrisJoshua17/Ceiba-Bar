package com.project.micro_usuarios.controller;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.project.micro_usuarios.Feign.AuthClient;
import com.project.micro_usuarios.Feign.CustomerClient;
import com.project.micro_usuarios.Feign.DriverClient;
import com.project.micro_usuarios.model.Role;
import com.project.micro_usuarios.model.User;
import com.project.micro_usuarios.model.dto.UserDto;
import com.project.micro_usuarios.service.ImagesService;
import com.project.micro_usuarios.service.UserServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
@Log4j2
public class UserController {

    private final UserServiceImpl service;
    private final AuthClient authClient;
    private final CustomerClient customerClient;
    private final DriverClient driverClient;
    private final ImagesService imagesService;

    // === MÉTODO AUXILIAR PARA VALIDAR ADMIN ===
    private boolean validateAdmin(String token) {
        log.warn(token);
        try {
            return authClient.validateAdminToken(token).getData();
        } catch (Exception e) {
            log.error("Error validando token de admin: {}", e.getMessage());
            return false;
        }
    }

    // === ENDPOINT PARA DESARROLLO - Crear primer admin ===
    @PostMapping("/init-admin")
    public ResponseEntity<?> initAdmin() {
        Map<String, Object> response = new HashMap<>();
        try {
            User admin = new User();
            admin.setName("Joshua");
            admin.setLastName("Alvarez");
            admin.setEmail("cristopher17@hotmail.com");
            admin.setPassword("170498");
            admin.setRole(Role.ADMIN);

            User userSave = service.createUser(admin);

            response.put("success", true);
            response.put("message", "Administrador inicial creado exitosamente");
            response.put("data", userSave);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al crear administrador inicial");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === REGISTRO PÚBLICO - Siempre asigna CUSTOMER ===
    @PostMapping("/register")
    public ResponseEntity<?> registerCustomer(@RequestBody User user) {
        Map<String, Object> response = new HashMap<>();
        try {
            user.setRole(Role.CUSTOMER);
            User userSave = service.createUser(user);

            // SOLO esta llamada después de crear el usuario
            try {
                customerClient.createCustomerProfile(userSave.getId(), userSave.getEmail());
                log.info("Perfil de customer creado automáticamente para: {}", userSave.getEmail());
            } catch (Exception e) {
                log.error("Error creando perfil en micro_customer: {}", e.getMessage());
            }

            response.put("success", true);
            response.put("message", "Cliente registrado exitosamente");
            response.put("data", userSave);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al registrar el cliente: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === CREAR DRIVER - Solo ADMIN ===
    @PostMapping("/drivers")
    public ResponseEntity<?> createDriver(@RequestBody User user,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            user.setRole(Role.DRIVER);
            User userSave = service.createUser(user);

            // Agregar la llamada al microservicio de drivers
            try {
                driverClient.createDriverProfile(userSave.getId(), userSave.getEmail());
                log.info("Perfil de driver creado automáticamente para: {}", userSave.getEmail());
            } catch (Exception e) {
                log.error("Error creando perfil en micro_driver: {}", e.getMessage());
            }

            response.put("success", true);
            response.put("message", "Driver creado exitosamente");
            response.put("data", userSave);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al crear el driver: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === CREAR ADMIN - Solo ADMIN ===
    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(@RequestBody User user,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            user.setRole(Role.ADMIN);
            User userSave = service.createUser(user);

            // Los ADMINS no necesitan perfil en otros microservicios
            response.put("success", true);
            response.put("message", "Administrador creado exitosamente");
            response.put("data", userSave);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al crear el administrador: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === LISTAR USUARIOS - Solo ADMIN ===
    @GetMapping
    public ResponseEntity<?> findAll(@RequestHeader(value = "Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            List<User> users = service.findAll();

            response.put("success", true);
            response.put("message", "Users obtenidos exitosamente");
            response.put("data", users);
            response.put("timestamp", LocalDateTime.now());
            response.put("count", users.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener los users");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // === LISTAR USUARIOS POR ROL - Solo ADMIN ===
    @GetMapping("/role/{role}")
    public ResponseEntity<?> findAllByRole(@PathVariable Role role) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<User> users = service.findAllByRole(role);

            response.put("success", true);
            response.put("message", "Users obtenidos exitosamente");
            response.put("data", users);
            response.put("timestamp", LocalDateTime.now());
            response.put("count", users.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener los users");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // === OBTENER POR ID - ===
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id,
            @RequestHeader(value = "Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<User> optionalUser = service.findById(id);

            if (optionalUser.isEmpty()) {
                response.put("success", false);
                response.put("message", "Usuario no encontrado");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Opcional: Validar que el usuario solo pueda ver su propio perfil a menos que
            // sea ADMIN
            User user = optionalUser.get();

            response.put("success", true);
            response.put("message", "User obtenido exitosamente");
            response.put("data", user);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener el user");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> findByEmail(@PathVariable String email) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<User> optionalUser = service.findByEmail(email);

            if (optionalUser.isEmpty()) {
                response.put("success", false);
                response.put("message", "Usuario no encontrado");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            response.put("success", true);
            response.put("message", "User obtenido exitosamente");
            response.put("data", optionalUser.get());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener el user");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // === ENDPOINTS INTERNOS PARA COMUNICACIÓN ENTRE MICROSERVICIOS ===
    @GetMapping("/internal/email/{email}")
    public UserDto findByEmailForAuth(@PathVariable String email) {
        User user = service.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email: " + email));
        return convertToDto(user);
    }

    @GetMapping("/internal/{id}")
    public UserDto getUserByIdInternal(@PathVariable Long id) {
        User user = service.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        return convertToDto(user);
    }

    // === CREAR USUARIO - Solo ADMIN (considera eliminar este endpoint si no es
    // necesario) ===
    @PostMapping
    public ResponseEntity<?> saveUser(@RequestBody User user,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            User userSave = service.createUser(user);
            response.put("success", true);
            response.put("message", "User guardado exitosamente");
            response.put("data", userSave);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al guardar el user");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === ACTUALIZAR USUARIO - Con validación de ID ===
    @PutMapping(value = "/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateUser(
            @PathVariable Long userId,
            @RequestParam("name") String name,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam(value = "phone", required = false) Long phone,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Map<String, Object> response = new HashMap<>();
        try {
            // Verificar que el usuario existe
            Optional<User> existingUser = service.findById(userId);
            if (existingUser.isEmpty()) {
                response.put("success", false);
                response.put("message", "Usuario no encontrado");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Actualizar usuario
            User userToUpdate = existingUser.get();
            userToUpdate.setName(name);
            userToUpdate.setLastName(lastName);
            userToUpdate.setEmail(email);
            userToUpdate.setPhone(phone);

            // Manejar imagen si se proporciona
            if (image != null && !image.isEmpty()) {
                // Eliminar imagen anterior del filesystem si existe
                String oldImage = userToUpdate.getImage();
                if (oldImage != null && !oldImage.isEmpty()) {
                    try {
                        imagesService.deleteImageFromFileSystem(oldImage);
                    } catch (Exception e) {
                        log.warn("Error al eliminar imagen anterior: {}", e.getMessage());
                    }
                }

                // Guardar nueva imagen en filesystem y obtener URL
                String imageUrl = imagesService.saveImageToFileSystem(image);
                userToUpdate.setImage(imageUrl); // Ahora es String, compatible
            }

            User updatedUser = service.update(userToUpdate);
            response.put("success", true);
            response.put("message", "Usuario actualizado exitosamente");
            response.put("data", updatedUser);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar el usuario");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === ACTUALIZAR IMAGEN ===
    @PatchMapping(value = "/{id}/image", consumes = "multipart/form-data")
    public ResponseEntity<?> updateImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (image == null || image.isEmpty()) {
                response.put("success", false);
                response.put("message", "La imagen es obligatoria");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("message", "Solo se permiten archivos de imagen");
                response.put("error", "Tipo no permitido: " + contentType);
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            long maxSize = 5 * 1024 * 1024;
            if (image.getSize() > maxSize) {
                response.put("success", false);
                response.put("message", "La imagen excede el tamaño máximo de 5MB");
                response.put("error", "Tamaño: " + (image.getSize() / 1024 / 1024) + "MB");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            Optional<User> optionalUser = service.findById(id);
            if (optionalUser.isEmpty()) {
                response.put("success", false);
                response.put("message", "Usuario no encontrado con ID: " + id);
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            User user = optionalUser.get();

            // Eliminar imagen anterior si existe
            String oldImage = user.getImage();
            if (oldImage != null && !oldImage.isEmpty()) {
                try {
                    imagesService.deleteImageFromFileSystem(oldImage);
                } catch (Exception e) {
                    log.warn("Error al eliminar imagen anterior: {}", e.getMessage());
                }
            }

            // Guardar nueva imagen y obtener URL (ahora es String, no byte[])
            String imageUrl = imagesService.saveImageToFileSystem(image);
            user.setImage(imageUrl); // ✅ Ahora compatible - String con String

            User updatedUser = service.update(user);

            response.put("success", true);
            response.put("message", "Imagen actualizada exitosamente");
            response.put("data", updatedUser);
            response.put("timestamp", LocalDateTime.now());

            log.info("Imagen actualizada para usuario ID: {}", id);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error al actualizar imagen para usuario ID: {}", id, e);
            response.put("success", false);
            response.put("message", "Error al procesar la imagen");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === ELIMINAR USUARIO - Solo ADMIN ===
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId,
            @RequestHeader(value = "Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            service.delete(userId);
            response.put("success", true);
            response.put("message", "User eliminado exitosamente");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar el user");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPassword(user.getPassword());
        dto.setRole(user.getRole().name());
        dto.setPhone(user.getPhone());
        dto.setImage(user.getImage());
        return dto;
    }
}