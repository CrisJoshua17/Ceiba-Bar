package com.project.micro_payments.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.project.micro_payments.model.enums.PaymentMethod;
import com.project.micro_payments.model.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payment_order", columnList = "order_id"),
        @Index(name = "idx_payment_idempotency", columnList = "idempotency_key")
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Payment extends BaseEntity {

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    private String currency = "MXN";

    @Enumerated(EnumType.STRING)
    private PaymentMethod method; // STRIPE, PAYPAL

    @Enumerated(EnumType.STRING)
    private PaymentStatus status; // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Column(name = "receipt_url")
    private String receiptUrl;

    // Campos de reembolso (nuevos)
    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_reason")
    private String refundReason;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    // Stripe específico
    @Column(name = "stripe_session_id")
    private String stripeSessionId;
    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    // PayPal específico
    @Column(name = "paypal_order_id")
    private String paypalOrderId;
    @Column(name = "paypal_payer_id")
    private String paypalPayerId;
    @Column(name = "paypal_capture_id")
    private String paypalCaptureId;

}
