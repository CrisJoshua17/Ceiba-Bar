package com.project.micro_productos.repository;

import com.project.micro_productos.model.StockReservation;
import com.project.micro_productos.model.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {
    List<StockReservation> findByOrderId(Long orderId);
    List<StockReservation> findByOrderIdAndStatus(Long orderId, ReservationStatus status);
}
