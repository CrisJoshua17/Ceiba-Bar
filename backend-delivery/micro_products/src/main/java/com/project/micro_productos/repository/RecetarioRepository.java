package com.project.micro_productos.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.micro_productos.model.Recetario;

@Repository
public interface  RecetarioRepository extends JpaRepository<Recetario, Long> {
    
    List<Recetario> findByAvailableTrue();
    List<Recetario> findByNameContainingIgnoreCaseAndAvailableTrue(String name);
    List<Recetario> findByAvailableFalse();
}
