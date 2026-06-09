package com.project.micro_payments.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.micro_payments.model.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByStripeSessionId(String stripeSessionId);

    Optional<Payment> findByOrderId(Long orderId);

    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    
    Optional<Payment> findByPaypalOrderId(String paypalOrderId);

}
