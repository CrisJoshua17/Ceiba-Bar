package com.project.micro_payments.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.micro_payments.dto.StripeEventProcessed;

public interface StripeEventProcessedRepository extends JpaRepository<StripeEventProcessed, String> {

}
