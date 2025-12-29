package com.project.micro_realtime.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.micro_realtime.model.Delivery;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    /**
     * Encuentra todas las entregas de un driver específico
     */
    List<Delivery> findByDriverId(Long driverId);

    /**
     * Encuentra todas las entregas de una orden (historial)
     */
    List<Delivery> findByOrderId(Long orderId);

    /**
     * Encuentra la última entrega de una orden
     */
    Optional<Delivery> findTopByOrderIdOrderByAssignedAtDesc(Long orderId);

    /**
     * Encuentra la entrega activa de una orden (la que no tiene completedAt)
     */
    Optional<Delivery> findByOrderIdAndCompletedAtIsNull(Long orderId);
}
