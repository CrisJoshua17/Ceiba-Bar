package com.project.micro_payments.service;

import java.math.BigDecimal;
import com.project.micro_payments.dto.OrderDto;
import com.project.micro_payments.model.Payment;

public interface PaymentGateway {
    
    /**
     * Creates a payment session/order and returns the redirect URL for the user.
     */
    String createPayment(Payment payment, OrderDto orderDto, String itemProduct) throws Exception;
    
    /**
     * Validates the payment status via API call (pull approach).
     * Returns true if payment is completed.
     */
    boolean validatePayment(Payment payment) throws Exception;
    
    /**
     * Processes a partial or full refund.
     */
    boolean refundPayment(Payment payment, BigDecimal amount, String reason) throws Exception;
}
