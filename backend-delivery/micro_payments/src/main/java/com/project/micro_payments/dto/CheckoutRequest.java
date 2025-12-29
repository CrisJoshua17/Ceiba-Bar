package com.project.micro_payments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {

    @NotNull
    private OrderDto orderDto; // La orden completa

    @NotNull
    private Long amount; // Monto en centavos (ej: 10000 = $100.00 MXN)

    @NotBlank
    private String itemProduct; // Nombre del producto para mostrar en Stripe
}