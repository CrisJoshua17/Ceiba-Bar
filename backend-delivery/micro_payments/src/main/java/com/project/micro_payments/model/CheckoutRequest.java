package com.project.micro_payments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {

    @NotNull
    private OrderDto orderDto; // La orden completa

    private Long amount; // Opcional: el backend recalcula este monto de forma segura

    @NotBlank
    private String itemProduct; // Nombre del producto para mostrar en Stripe
    
    @NotBlank
    private String method; // "stripe" o "paypal"
    
    private String idempotencyKey; // Opcional: llave única para evitar cobros duplicados
}