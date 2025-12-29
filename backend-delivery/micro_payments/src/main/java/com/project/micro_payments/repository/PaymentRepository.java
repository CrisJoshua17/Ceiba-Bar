package com.project.micro_payments.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.micro_payments.dto.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByStripeSessionId(String stripeSessionId);

    Optional<Payment> findByOrderId(String orderId);

    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);

}
