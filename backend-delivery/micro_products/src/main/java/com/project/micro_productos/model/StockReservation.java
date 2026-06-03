package com.project.micro_productos.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.project.micro_productos.model.enums.ReservationStatus;


@Entity
@Table(name = "stock_reservations", indexes = {
        @Index(name = "idx_reservation_order", columnList = "order_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockReservation extends BaseEntity {

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "product_id")
    private Long productId;

    private Integer quantity;

    @Enumerated(EnumType.STRING)
    private ReservationStatus status = ReservationStatus.RESERVED;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt; // Auto-liberar si no se confirma
}
