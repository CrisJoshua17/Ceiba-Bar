package com.project.micro_payments.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stripe_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StripeEventProcessed {

    @Id
    @Column(name = "event_id")
    private String id;

    @Column(name = "processed_at")
    private Instant processedAt;
}
