package com.project.micro_payments.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String orderId;
    private String stripeSessionId;
    private String stripePaymentIntentId;
    private Long amount;
    private String status; // PENDING, PAID, FAILED
    @jakarta.persistence.Column(length = 5000)
    private String tempOrderData;
    private String createdAt;
    private String updatedAt;
}
