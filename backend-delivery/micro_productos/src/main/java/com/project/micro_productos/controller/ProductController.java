package com.project.micro_productos.controller;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.project.micro_productos.Feign.AuthClient;
import com.project.micro_productos.model.Drink;
import com.project.micro_productos.model.DrinkType;
import com.project.micro_productos.model.Product;
import com.project.micro_productos.model.Recetario;
import com.project.micro_productos.model.Snack;
import com.project.micro_productos.model.dto.ProductRequest;
import com.project.micro_productos.model.dto.ProductResponse;
import com.project.micro_productos.service.ImagesService;
import com.project.micro_productos.service.ProductService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Log4j2
// NOTA: CORS manejado por el Gateway, NO agregar @CrossOrigin aquí
public class ProductController {

    private final ProductService productService;
    private final AuthClient authClient;
    private final ImagesService imagesService;

    // === OBTENER TODOS LOS DISPONIBLES ===
    @GetMapping
    public ResponseEntity<?> findAllAvailable() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Product> products = productService.findAvailableProducts();
            List<ProductResponse> data = toResponseList(products);

            response.put("success", true);
            response.put("message", "Productos obtenidos exitosamente");
            response.put("data", data);
            response.put("count", data.size());
            response.put("timestamp", LocalDateTime.now());

            log.info("Productos disponibles obtenidos: {}", data.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error al obtener productos disponibles", e);
            response.put("success", false);
            response.put("message", "Error al obtener los productos");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === OBTENER TODOS LOS NO DISPONIBLES ===
    @GetMapping("/no-available")
    public ResponseEntity<?> findNoAvailable() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Product> products = productService.findNoAvailableProducts();
            List<ProductResponse> data = toResponseList(products);

            response.put("success", true);
            response.put("message", "Productos no disponibles obtenidos exitosamente");
            response.put("data", data);
            response.put("count", data.size());
            response.put("timestamp", LocalDateTime.now());

            log.info("Productos no disponibles obtenidos: {}", data.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error al obtener productos no disponibles", e);
            response.put("success", false);
            response.put("message", "Error al obtener los productos");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === OBTENER TODOS (INCLUYE NO DISPONIBLES) ===
    @GetMapping("/all")
    public ResponseEntity<?> findAll() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Product> products = productService.findAllProducts();
            List<ProductResponse> data = toResponseList(products);

            response.put("success", true);
            response.put("message", "Todos los productos obtenidos exitosamente");
            response.put("data", data);
            response.put("count", data.size());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error al obtener todos los productos", e);
            response.put("success", false);
            response.put("message", "Error al obtener los productos");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === BUSCAR POR ID ===
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Product product = productService.findProductById(id)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

            response.put("success", true);
            response.put("message", "Producto obtenido exitosamente");
            response.put("data", toResponse(product));
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.warn("Producto no encontrado: {}", id);
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        } catch (Exception e) {
            log.error("Error al obtener producto por id: {}", id, e);
            response.put("success", false);
            response.put("message", "Error interno del servidor");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === BÚSQUEDA GLOBAL ===
    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String name) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Product> products = productService.searchProducts(name);
            List<ProductResponse> data = toResponseList(products);

            response.put("success", true);
            response.put("message", "Búsqueda completada");
            response.put("data", data);
            response.put("count", data.size());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error en búsqueda de productos: {}", name, e);
            response.put("success", false);
            response.put("message", "Error al buscar productos");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === CREAR PRODUCTO (CON O SIN FOTO) ===
    @PostMapping()
    public ResponseEntity<?> create(@ModelAttribute ProductRequest request,
            @RequestHeader(value = "Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Validar que sea ADMIN
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // === VALIDACIÓN DE IMAGEN ===
            MultipartFile imageFile = request.getImage();
            if (imageFile != null && !imageFile.isEmpty()) {
                String contentType = imageFile.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    response.put("success", false);
                    response.put("message", "Solo se permiten archivos de imagen");
                    response.put("timestamp", LocalDateTime.now());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                }

                long maxSize = 5 * 1024 * 1024;
                if (imageFile.getSize() > maxSize) {
                    response.put("success", false);
                    response.put("message", "La imagen excede el tamaño máximo de 5MB");
                    response.put("timestamp", LocalDateTime.now());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                }
            }

            Product product = createProductByType(request);
            product.setName(request.getName());
            product.setDescription(request.getDescription());
            product.setPrice(request.getPrice());
            product.setAvailable(request.getAvailable() != null ? request.getAvailable() : true);

            // === CORREGIDO: Asignar drinkType ANTES de guardar ===
            if (product instanceof Drink && request.getDrinkType() != null) {
                try {
                    DrinkType drinkType = DrinkType.valueOf(request.getDrinkType().toUpperCase());
                    ((Drink) product).setType(drinkType);
                    log.info("DrinkType asignado: {}", drinkType);
                } catch (IllegalArgumentException e) {
                    log.warn("DrinkType inválido: {}", request.getDrinkType());
                    throw new IllegalArgumentException("Tipo de bebida inválido: " + request.getDrinkType());
                }
            }

            // Guardar imagen
            if (imageFile != null && !imageFile.isEmpty()) {
                String imagePath = imagesService.saveImageToFileSystem(imageFile);
                product.setImage(imagePath);
            }

            Product saved = saveProduct(product);
            ProductResponse data = toResponse(saved);

            // Log para debug
            log.info("Producto creado - ID: {}, Tipo: {}, DrinkType: {}, Imagen: {}",
                    data.getId(), data.getType(), data.getDrinkType(), data.getImage() != null);

            response.put("success", true);
            response.put("message", "Producto creado exitosamente");
            response.put("data", data);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);

        } catch (Exception e) {
            log.error("Error al crear producto", e);
            response.put("success", false);
            response.put("message", "Error al crear el producto");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === ACTUALIZAR PRODUCTO (CON O SIN FOTO) ===
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
            @ModelAttribute ProductRequest request,
            @RequestHeader(value = "Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Validar que sea ADMIN
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            Optional<Product> productOptional = productService.findProductById(id);
            if (!productOptional.isPresent()) {
                response.put("success", false);
                response.put("message", "Producto no encontrado con id: " + id);
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Actualizar Producto
            Product existingProduct = productOptional.get();
            existingProduct.setName(request.getName());
            existingProduct.setDescription(request.getDescription());
            existingProduct.setPrice(request.getPrice());
            existingProduct.setAvailable(request.getAvailable() != null ? request.getAvailable() : true);

            // Manejar imagen si se presenta
            MultipartFile imageFile = request.getImage();
            if (imageFile != null && !imageFile.isEmpty()) {
                // Eliminar la imagen anterior si existe
                if (existingProduct.getImage() != null && !existingProduct.getImage().isEmpty()) {
                    try {
                        imagesService.deleteImageFromFileSystem(existingProduct.getImage());
                    } catch (Exception e) {
                        log.warn("Error al eliminar la imagen anterior: {}", e.getMessage());
                    }
                }
                // Guardar nueva imagen
                String imagePath = imagesService.saveImageToFileSystem(imageFile);
                existingProduct.setImage(imagePath);
                log.info("Imagen actualizada para producto ID: {}", id);
            }

            // Si es una bebida, actualizar el tipo
            if (existingProduct instanceof Drink && request.getDrinkType() != null) {
                ((Drink) existingProduct).setType(DrinkType.valueOf(request.getDrinkType().toUpperCase()));
            }

            Product updated = saveProduct(existingProduct);
            ProductResponse data = toResponse(updated);

            response.put("success", true);
            response.put("message", "Producto actualizado exitosamente");
            response.put("data", data);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        } catch (Exception e) {
            log.error("Error al actualizar producto: {}", id, e);
            response.put("success", false);
            response.put("message", "Error al actualizar el producto");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // === ACTUALIZAR SOLO LA FOTO ===
    @PatchMapping(value = "/{id}/image", consumes = "multipart/form-data")
    public ResponseEntity<?> updateImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validar que sea ADMIN
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // === VALIDACIONES ===
            if (image == null || image.isEmpty()) {
                response.put("success", false);
                response.put("message", "La imagen es obligatoria");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Validar tipo de archivo
            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("message", "Solo se permiten archivos de imagen");
                response.put("error", "Tipo no permitido: " + contentType);
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Validar tamaño (máx 5MB)
            long maxSize = 5 * 1024 * 1024; // 5MB
            if (image.getSize() > maxSize) {
                response.put("success", false);
                response.put("message", "La imagen excede el tamaño máximo de 5MB");
                response.put("error", "Tamaño: " + (image.getSize() / 1024 / 1024) + "MB");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // === PROCESAR IMAGEN ===
            Product product = productService.findProductById(id)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            // Eliminar imagen anterior si existe
            if (product.getImage() != null && !product.getImage().isEmpty()) {
                try {
                    imagesService.deleteImageFromFileSystem(product.getImage());
                } catch (Exception e) {
                    log.warn("Error al eliminar la imagen anterior: {}", e.getMessage());
                }
            }

            // Guardar nueva imagen
            String imagePath = imagesService.saveImageToFileSystem(image);
            product.setImage(imagePath);

            Product updated = saveProduct(product);

            response.put("success", true);
            response.put("message", "Imagen actualizada exitosamente");
            response.put("data", toResponse(updated));
            response.put("timestamp", LocalDateTime.now());

            log.info("Imagen actualizada para producto ID: {}", id);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        } catch (Exception e) {
            log.error("Error inesperado al actualizar imagen: {}", id, e);
            response.put("success", false);
            response.put("message", "Error interno del servidor");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === TOGGLE DISPONIBILIDAD ===
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleAvailability(@PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Validar que sea ADMIN
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            Product product = productService.toggleProductAvailability(id);
            ProductResponse data = toResponse(product);

            response.put("success", true);
            response.put("message", "Disponibilidad actualizada");
            response.put("data", data);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        } catch (Exception e) {
            log.error("Error al cambiar disponibilidad: {}", id, e);
            response.put("success", false);
            response.put("message", "Error al cambiar disponibilidad");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === ELIMINAR ===
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id,
            @RequestHeader(value = "Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Validar que sea ADMIN
            if (!validateAdmin(authHeader)) {
                response.put("success", false);
                response.put("message", "No autorizado - Se requiere rol ADMIN");
                response.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // Obtener producto para eliminar su imagen
            Optional<Product> productOptional = productService.findProductById(id);
            if (productOptional.isPresent()) {
                Product product = productOptional.get();
                // Eliminar imagen si existe
                if (product.getImage() != null && !product.getImage().isEmpty()) {
                    try {
                        imagesService.deleteImageFromFileSystem(product.getImage());
                    } catch (Exception e) {
                        log.warn("Error al eliminar la imagen del producto: {}", e.getMessage());
                    }
                }
            }

            productService.deleteProduct(id);

            response.put("success", true);
            response.put("message", "Producto eliminado exitosamente");
            response.put("timestamp", LocalDateTime.now());

            log.info("Producto eliminado: {}", id);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        } catch (Exception e) {
            log.error("Error al eliminar producto: {}", id, e);
            response.put("success", false);
            response.put("message", "Error al eliminar el producto");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === MÉTODOS AUXILIARES ===
    private Product createProductByType(ProductRequest request) {
        return switch (request.getType().toUpperCase()) {
            case "DRINK" -> new Drink();
            case "SNACK" -> new Snack();
            case "RECETARIO" -> new Recetario();
            default -> throw new IllegalArgumentException("Tipo inválido: " + request.getType());
        };
    }

    private Product saveProduct(Product product) {
        log.info("Guardando producto - Tipo: {}, ID: {}, DrinkType: {}",
                product.getClass().getSimpleName(),
                product.getId(),
                (product instanceof Drink) ? ((Drink) product).getType() : "N/A");

        // Si el ID es null, es un producto nuevo → usar create
        if (product.getId() == null) {
            if (product instanceof Drink) {
                Drink saved = productService.createDrink((Drink) product);
                log.info("Bebida creada - ID: {}, DrinkType persistido: {}",
                        saved.getId(), saved.getType());
                return saved;
            }
            if (product instanceof Snack)
                return productService.createSnack((Snack) product);
            if (product instanceof Recetario)
                return productService.createRecetario((Recetario) product);
        } else {
            // Si el ID existe, es una actualización → usar update
            if (product instanceof Drink) {
                Drink updated = productService.updateDrink((Drink) product);
                log.info("Bebida actualizada - ID: {}, DrinkType persistido: {}",
                        updated.getId(), updated.getType());
                return updated;
            }
            if (product instanceof Snack)
                return productService.updateSnack((Snack) product);
            if (product instanceof Recetario)
                return productService.updateRecetario((Recetario) product);
        }
        throw new RuntimeException("Tipo no soportado");
    }

    private ProductResponse toResponse(Product product) {
        ProductResponse res = new ProductResponse();
        res.setId(product.getId());
        res.setName(product.getName());
        res.setDescription(product.getDescription());
        res.setPrice(product.getPrice());
        res.setAvailable(product.getAvailable());
        res.setImage(product.getImage());
        res.setType(getType(product));
        if (product instanceof Drink) {
            DrinkType drinkType = ((Drink) product).getType();
            if (drinkType != null) {
                res.setDrinkType(drinkType.name());
            }
        }
        return res;
    }

    private List<ProductResponse> toResponseList(List<Product> products) {
        return products.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private String getType(Product product) {
        if (product instanceof Drink)
            return "DRINK";
        if (product instanceof Snack)
            return "SNACK";
        if (product instanceof Recetario)
            return "RECETARIO";
        return "UNKNOWN";
    }

    // === MÉTODO AUXILIAR PARA VALIDAR ADMIN ===
    private boolean validateAdmin(String authHeader) {
        try {
            return authClient.validateAdminToken(authHeader).getData();
        } catch (Exception e) {
            log.error("Error validando token de admin: {}", e.getMessage());
            return false;
        }
    }
}