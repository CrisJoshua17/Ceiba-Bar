package com.project.micro_payments.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.google.gson.JsonSyntaxException;
import com.project.micro_payments.service.StripeService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments/webhook")
@RequiredArgsConstructor
public class StripeWebhookController {
    @Value("${stripe.webhook-secret}")
    private String endpointSecret;
    private final StripeService stripeService;

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader,
            @RequestBody String payload) {

        if (endpointSecret == null || endpointSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Webhook secret not configured");
        }
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
            // Delegar procesamiento idempotente
            stripeService.handleEvent(event);
            return ResponseEntity.ok("");
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid signature");
        } catch (JsonSyntaxException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid payload");
        } catch (Exception e) {
            // 500 -> Stripe reintentará
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error");
        }
    }
}