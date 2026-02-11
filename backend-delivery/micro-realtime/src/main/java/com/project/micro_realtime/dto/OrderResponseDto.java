package com.project.micro_realtime.dto;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import com.project.micro_realtime.model.OrderStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDto {

    // Campos de Order
    private Long id;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private String address;
    private Double destinationLat;
    private Double destinationLng;
    private List<ProductDto> products;
    private OrderStatus status;

    // Campos de Rating
    private Integer rating;
    private String feedback;
    private LocalDateTime ratedAt;

    // Campos enriquecidos de Delivery
    private Long driverId;
    private String driverName; // Nombre del repartidor (viene de micro-usuarios)
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;

    // Campo calculado
    private String deliveryTime; // Tiempo total de entrega formateado (ej: "15 min")

    /**
     * Calcula el tiempo de entrega basado en assignedAt y completedAt
     */
    public void calculateDeliveryTime() {
        if (assignedAt != null && completedAt != null) {
            Duration duration = Duration.between(assignedAt, completedAt);
            long minutes = duration.toMinutes();
            long seconds = duration.minusMinutes(minutes).getSeconds();

            if (minutes > 0) {
                this.deliveryTime = minutes + " min";
            } else {
                this.deliveryTime = seconds + " seg";
            }
        } else if (assignedAt != null && status == OrderStatus.EN_CAMINO) {
            // Si está en camino, mostrar tiempo transcurrido
            Duration duration = Duration.between(assignedAt, LocalDateTime.now());
            long minutes = duration.toMinutes();
            this.deliveryTime = minutes + " min (en curso)";
        }
    }
}
