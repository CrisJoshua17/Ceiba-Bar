package com.project.micro_productos.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.micro_productos.model.Snack;

@Repository
public interface SnackRepository extends JpaRepository<Snack, Long> {
     List<Snack> findByAvailableTrue();
     List<Snack> findByNameContainingIgnoreCaseAndAvailableTrue(String name);
     List<Snack> findByAvailableFalse();
}
