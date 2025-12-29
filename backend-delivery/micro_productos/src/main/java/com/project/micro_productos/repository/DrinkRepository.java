package com.project.micro_productos.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.micro_productos.model.Drink;
import com.project.micro_productos.model.DrinkType;

@Repository
public interface DrinkRepository extends JpaRepository<Drink, Long> {
    
    List<Drink> findByAvailableTrue();
    List<Drink> findByTypeAndAvailableTrue(DrinkType drinkType);
    List<Drink> findByNameContainingIgnoreCaseAndAvailableTrue(String name);
    List<Drink> findByAvailableFalse();

}
