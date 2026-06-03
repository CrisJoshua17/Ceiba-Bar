package com.project.micro_productos.config;

import com.project.micro_productos.model.Drink;
import com.project.micro_productos.model.DrinkType;
import com.project.micro_productos.model.Recetario;
import com.project.micro_productos.model.Snack;
import com.project.micro_productos.repository.DrinkRepository;
import com.project.micro_productos.repository.RecetarioRepository;
import com.project.micro_productos.repository.SnackRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final DrinkRepository drinkRepository;
    private final SnackRepository snackRepository;
    private final RecetarioRepository recetarioRepository;

    private final Path uploadsDir = Paths.get("uploads/images");

    @PostConstruct
    public void init() {
        long total = drinkRepository.count() + snackRepository.count() + recetarioRepository.count();
        if (total > 0) {
            log.info("✅ Productos ya existen en BD ({} registros), saltando seed.", total);
            return;
        }

        log.info("🌱 Iniciando seed de productos...");
        try {
            Files.createDirectories(uploadsDir);
            seedDrinks();
            seedSnacks();
            seedRecetario();
            log.info("✅ Seed completado: {} bebidas, {} snacks, {} recetas.",
                    drinkRepository.count(), snackRepository.count(), recetarioRepository.count());
        } catch (Exception e) {
            log.error("❌ Error durante el seed: {}", e.getMessage(), e);
        }
    }

    // ==================== BEBIDAS ====================

    private void seedDrinks() {
        // Alcohólicas
        createDrink("Mojito Clásico", "Refrescante mojito con hierbabuena y ron", 9.99, DrinkType.ALCOHOLIC,
                "coctel1.jpg");
        createDrink("Margarita Frozen", "Margarita helada con limón y sal", 10.50, DrinkType.ALCOHOLIC, "coctel2.jpg");
        createDrink("Piña Colada", "Cóctel tropical de coco y piña", 11.00, DrinkType.ALCOHOLIC, "coctel3.jpg");
        createDrink("Negroni", "Gin, Campari y vermut rojo", 12.50, DrinkType.ALCOHOLIC, "coctel4.jpg");
        createDrink("Old Fashioned", "Whisky, bitters, azúcar y naranja", 13.00, DrinkType.ALCOHOLIC, "coctel5.jpg");
        createDrink("Aperol Spritz", "Aperol con prosecco y naranja", 9.50, DrinkType.ALCOHOLIC, "coctel6.jpg");

        // No Alcohólicas
        createDrink("Smoothie de Fresa", "Batido natural de fresa con yogur", 7.50, DrinkType.NON_ALCOHOLIC,
                "coctel7.jpg");
        createDrink("Agua de Jamaica", "Agua fresca de flor de jamaica natural", 5.00, DrinkType.NON_ALCOHOLIC,
                "coctel8.jpg");
        createDrink("Limonada Especial", "Limonada artesanal con menta y jengibre", 6.50, DrinkType.NON_ALCOHOLIC,
                "coctel9.jpg");
        createDrink("Limonada de Tarros", "Limonada artesanal servida en tarros", 6.50, DrinkType.NON_ALCOHOLIC,
                "tarros.png");
        createDrink("Mojito Sin Alcohol", "Mojito virgin refrescante con menta", 7.00, DrinkType.NON_ALCOHOLIC,
                "mojitos.png");
    }

    private void createDrink(String name, String description, double price, DrinkType type, String imageFile) {
        String imagePath = copyImage(imageFile);
        Drink drink = new Drink();
        drink.setName(name);
        drink.setDescription(description);
        drink.setPrice(price);
        drink.setAvailable(true);
        drink.setImage(imagePath);
        drink.setType(type);
        drinkRepository.save(drink);
        log.info("  🍹 {}", name);
    }

    // ==================== SNACKS ====================

    private void seedSnacks() {
        createSnack("Nachos con Guacamole", "Nachos crujientes con guacamole casero", 8.50, "coctel1.jpg");
        createSnack("Alitas BBQ", "Alitas de pollo con salsa barbecue", 10.50, "coctel2.jpg");
        createSnack("Tabla de Quesos", "Quesos artesanales con mermelada y pan", 12.00, "coctel3.jpg");
        createSnack("Papas Fritas", "Papas con sal y especias de la casa", 5.50, "coctel4.jpg");
    }

    private void createSnack(String name, String description, double price, String imageFile) {
        String imagePath = copyImage(imageFile);
        Snack snack = new Snack();
        snack.setName(name);
        snack.setDescription(description);
        snack.setPrice(price);
        snack.setAvailable(true);
        snack.setImage(imagePath);
        snackRepository.save(snack);
        log.info("  🍟 {}", name);
    }

    // ==================== RECETARIO ====================

    private void seedRecetario() {
        createReceta("Mojito Especial", "Receta exclusiva con ron añejo selecto", 15.00, "coctel5.jpg");
        createReceta("Cóctel de la Casa", "Cóctel secreto con ingredientes premium", 18.00, "coctel6.jpg");
        createReceta("Margarita Premium", "Con tequila premium y sal de gusano", 16.50, "coctel7.jpg");
    }

    private void createReceta(String name, String description, double price, String imageFile) {
        String imagePath = copyImage(imageFile);
        Recetario receta = new Recetario();
        receta.setName(name);
        receta.setDescription(description);
        receta.setPrice(price);
        receta.setAvailable(true);
        receta.setImage(imagePath);
        recetarioRepository.save(receta);
        log.info("  📖 {}", name);
    }

    // ==================== UTILIDADES ====================

    /**
     * Copia imagen desde classpath:seed-images/images/<filename>
     * al directorio uploads/images/ en runtime.
     * Retorna la URL relativa "/images/<filename>".
     */
    private String copyImage(String filename) {
        try {
            Path destination = uploadsDir.resolve(filename);
            if (!Files.exists(destination)) {
                // Las imágenes están en: src/main/resources/seed-images/images/
                ClassPathResource resource = new ClassPathResource("seed-images/images/" + filename);
                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        Files.copy(is, destination, StandardCopyOption.REPLACE_EXISTING);
                    }
                    log.info("    📁 Imagen copiada: {}", filename);
                } else {
                    log.warn("    ⚠️ Imagen no encontrada en classpath: seed-images/images/{}", filename);
                    return null;
                }
            }
            return "/images/" + filename;
        } catch (IOException e) {
            log.error("    ❌ Error copiando imagen {}: {}", filename, e.getMessage());
            return null;
        }
    }
}
