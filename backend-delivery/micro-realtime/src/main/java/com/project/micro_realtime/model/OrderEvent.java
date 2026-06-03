package com.project.micro_realtime.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_events", indexes = {
        @Index(name = "idx_events_order", columnList = "order_id"),
        @Index(name = "idx_events_occurred", columnList = "occurred_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type")
    private OrderEventType eventType;

    @Column(columnDefinition = "TEXT")
    private String payload; // JSON con datos del evento

    @Column(name = "triggered_by")
    private String triggeredBy; // userId o "SYSTEM"

    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;
}
