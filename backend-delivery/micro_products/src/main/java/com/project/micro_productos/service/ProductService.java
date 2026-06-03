package com.project.micro_productos.service;

import com.project.micro_productos.model.*;
import com.project.micro_productos.repository.DrinkRepository;
import com.project.micro_productos.repository.SnackRepository;
import com.project.micro_productos.repository.RecetarioRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final DrinkRepository drinkRepository;
    private final SnackRepository snackRepository;
    private final RecetarioRepository recetarioRepository;

    // === MÉTODOS GENÉRICOS PARA TODOS LOS PRODUCTOS ===
    
    public List<Product> findAllProducts() {
        List<Product> products = new ArrayList<>();
        products.addAll(drinkRepository.findAll());
        products.addAll(snackRepository.findAll());
        products.addAll(recetarioRepository.findAll());
        return products;
    }
    
    public List<Product> findAvailableProducts() {
        List<Product> products = new ArrayList<>();
        products.addAll(drinkRepository.findByAvailableTrue());
        products.addAll(snackRepository.findByAvailableTrue());
        products.addAll(recetarioRepository.findByAvailableTrue());
        return products;
    }

       public List<Product> findNoAvailableProducts() {
        List<Product> products = new ArrayList<>();
        products.addAll(drinkRepository.findByAvailableFalse());
        products.addAll(snackRepository.findByAvailableFalse());
        products.addAll(recetarioRepository.findByAvailableFalse());
        return products;
    }
    
    
    public Optional<Product> findProductById(Long id) {
        // Buscar en todos los repositorios
        Optional<Drink> drink = drinkRepository.findById(id);
        if (drink.isPresent()) return Optional.of(drink.get());

        Optional<Snack> snack = snackRepository.findById(id);
        if (snack.isPresent()) return Optional.of(snack.get());

        Optional<Recetario> recetario = recetarioRepository.findById(id);
        if (recetario.isPresent()) return Optional.of(recetario.get());

       return Optional.empty();
    }
    
    public void deleteProduct(Long id) {
        // Buscar y eliminar del repositorio correspondiente
        if (drinkRepository.existsById(id)) {
            drinkRepository.deleteById(id);
        } else if (snackRepository.existsById(id)) {
            snackRepository.deleteById(id);
        } else if (recetarioRepository.existsById(id)) {
            recetarioRepository.deleteById(id);
        } else {
            throw new RuntimeException("Producto no encontrado con id: " + id);
        }
    }

    // === MÉTODOS ESPECÍFICOS PARA DRINKS ===
    
    public Drink createDrink(Drink drink) {
        return drinkRepository.save(drink);
    }
    
    public List<Drink> findAllDrinks() {
        return drinkRepository.findAll();
    }
    
    public List<Drink> findAvailableDrinks() {
        return drinkRepository.findByAvailableTrue();
    }
    
    public List<Drink> findDrinksByType(DrinkType type) {
        return drinkRepository.findByTypeAndAvailableTrue(type);
    }
    
    public List<Drink> findAlcoholicDrinks() {
        return drinkRepository.findByTypeAndAvailableTrue(DrinkType.ALCOHOLIC);
    }
    
    public List<Drink> findNonAlcoholicDrinks() {
        return drinkRepository.findByTypeAndAvailableTrue(DrinkType.NON_ALCOHOLIC);
    }
    
    public Drink updateDrink(Drink drink) {
        Drink drinkDb = drinkRepository.findById(drink.getId())
            .orElseThrow(() -> new RuntimeException("Bebida no encontrada con id: " + drink.getId()));
        
        drinkDb.setName(drink.getName());
        drinkDb.setDescription(drink.getDescription());
        drinkDb.setPrice(drink.getPrice());
        drinkDb.setAvailable(drink.getAvailable());
        drinkDb.setType(drink.getType());
        
        return drinkRepository.save(drinkDb);
    }

    // === MÉTODOS ESPECÍFICOS PARA SNACKS ===
    
    public Snack createSnack(Snack snack) {
        return snackRepository.save(snack);
    }
    
    public List<Snack> findAllSnacks() {
        return snackRepository.findAll();
    }
    
    public List<Snack> findAvailableSnacks() {
        return snackRepository.findByAvailableTrue();
    }
    
    public Snack updateSnack(Snack snack) {
        Snack snackDb = snackRepository.findById(snack.getId())
            .orElseThrow(() -> new RuntimeException("Snack no encontrado con id: " + snack.getId()));
        
        snackDb.setName(snack.getName());
        snackDb.setDescription(snack.getDescription());
        snackDb.setPrice(snack.getPrice());
        snackDb.setAvailable(snack.getAvailable());
        
        return snackRepository.save(snackDb);
    }

    // === MÉTODOS ESPECÍFICOS PARA RECETARIO ===

    public Recetario createRecetario(Recetario recetario) {
        return recetarioRepository.save(recetario);
    }

    public List<Recetario> findAllRecetario() {
        return recetarioRepository.findAll();
    }

    public List<Recetario> findAvailableRecetario() {
        return recetarioRepository.findByAvailableTrue();
    }

    public Recetario updateRecetario(Recetario recetario) {
        Recetario recetarioDb = recetarioRepository.findById(recetario.getId())
                .orElseThrow(() -> new RuntimeException("Recetario no encontrado con id: " + recetario.getId()));

        recetarioDb.setName(recetario.getName());
        recetarioDb.setDescription(recetario.getDescription());
        recetarioDb.setPrice(recetario.getPrice());
        recetarioDb.setAvailable(recetario.getAvailable());
        // Campos específicos de Recetario si los tienes

        return recetarioRepository.save(recetarioDb);
    }

    // === MÉTODOS DE CONTROL DE DISPONIBILIDAD ===

    public Product toggleProductAvailability(Long id) {
        Product product = findProductById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

        product.setAvailable(!product.getAvailable());

        if (product instanceof Drink) {
            return drinkRepository.save((Drink) product);
        } else if (product instanceof Snack) {
            return snackRepository.save((Snack) product);
        } else if (product instanceof Recetario) {
            return recetarioRepository.save((Recetario) product);
        }

        throw new RuntimeException("Tipo de producto no soportado");
    }

    // === BÚSQUEDA GLOBAL ===

    public List<Product> searchProducts(String name) {
        List<Product> results = new ArrayList<>();
        results.addAll(drinkRepository.findByNameContainingIgnoreCaseAndAvailableTrue(name));
        results.addAll(snackRepository.findByNameContainingIgnoreCaseAndAvailableTrue(name));
        results.addAll(recetarioRepository.findByNameContainingIgnoreCaseAndAvailableTrue(name));
        return results;
    }
}