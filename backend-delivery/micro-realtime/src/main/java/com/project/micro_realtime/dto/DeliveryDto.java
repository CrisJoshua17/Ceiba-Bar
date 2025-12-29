package com.project.micro_realtime.dto;

import java.time.LocalDateTime;

import com.project.micro_realtime.model.OrderStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDto {

    private Long id;
    private Long orderId;
    private Long driverId;
    private LocalDateTime assignedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private OrderStatus status;
    private String notes;

    // Datos enriquecidos para el frontend
    private String driverEmail;
    private Double driverRating;
    private Integer driverTotalDeliveries;

    // Información de la orden (opcional)
    private String customerName;
    private String customerEmail;
    private String address;
}
