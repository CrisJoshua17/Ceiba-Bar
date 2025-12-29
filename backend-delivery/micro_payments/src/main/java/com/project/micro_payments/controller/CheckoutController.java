package com.project.micro_payments.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.micro_payments.dto.ApiResponse;
import com.project.micro_payments.dto.CheckoutRequest;
import com.project.micro_payments.service.StripeService;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class CheckoutController {

    private final StripeService stripeService;

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<String>> createCheckout(@RequestBody CheckoutRequest req) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            // Crear sesión de checkout con los datos de la orden
            Session session = stripeService.createCheckoutSession(
                    req.getOrderDto(),
                    req.getAmount(),
                    req.getItemProduct());
            // Retornar la URL de checkout para redirigir al cliente
            response.ok("Sesión de checkout creada exitosamente", session.getUrl());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.error("Error creando checkout: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/validate/{sessionId}")
    public ResponseEntity<ApiResponse<String>> validatePayment(
            @PathVariable("sessionId") String sessionId) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            var payment = stripeService.getPaymentBySessionId(sessionId);
            if (payment == null) {
                response.error("Pago no encontrado");
                return ResponseEntity.status(404).body(response);
            }
            if ("PAID".equals(payment.getStatus())) {
                response.ok("Pago validado exitosamente", payment.getOrderId());
                return ResponseEntity.ok(response);
            } else {
                response.error("El pago no ha sido completado. Estado: " + payment.getStatus());
                return ResponseEntity.status(400).body(response);
            }
        } catch (Exception e) {
            response.error("Error validando pago: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}