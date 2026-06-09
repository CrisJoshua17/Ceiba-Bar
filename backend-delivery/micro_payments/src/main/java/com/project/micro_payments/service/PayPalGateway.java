package com.project.micro_payments.service;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import com.project.micro_payments.dto.OrderDto;
import com.project.micro_payments.feign.PayPalClient;
import com.project.micro_payments.model.Payment;

import lombok.RequiredArgsConstructor;

@Component("paypal")
@RequiredArgsConstructor
public class PayPalGateway implements PaymentGateway {

    @Value("${paypal.client-id:}")
    private String clientId;

    @Value("${paypal.client-secret:}")
    private String clientSecret;

    @Value("${stripe.success-url}") // Reusamos para unificar
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    private final PayPalClient payPalClient;

    private String getAccessToken() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new RuntimeException("Credenciales de PayPal no configuradas en el entorno.");
        }
        String auth = clientId + ":" + clientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        ResponseEntity<Map<String, Object>> response = payPalClient.getAccessToken("Basic " + encodedAuth, "grant_type=client_credentials");
        Map<String, Object> body = response.getBody();
        if (body != null && body.containsKey("access_token")) {
            return "Bearer " + body.get("access_token").toString();
        }
        throw new RuntimeException("Error obteniendo el access_token de PayPal");
    }

    @Override
    public String createPayment(Payment payment, OrderDto orderDto, String itemProduct) throws Exception {
        String token = getAccessToken();

        Map<String, Object> orderPayload = new HashMap<>();
        orderPayload.put("intent", "CAPTURE");
        
        Map<String, Object> amount = new HashMap<>();
        amount.put("currency_code", payment.getCurrency().toUpperCase());
        amount.put("value", payment.getAmount().toString());
        
        Map<String, Object> purchaseUnit = new HashMap<>();
        purchaseUnit.put("amount", amount);
        purchaseUnit.put("reference_id", payment.getId().toString());
        
        orderPayload.put("purchase_units", List.of(purchaseUnit));
        
        Map<String, Object> applicationContext = new HashMap<>();
        applicationContext.put("return_url", successUrl + "?method=paypal&token=PAYPAL_TOKEN");
        applicationContext.put("cancel_url", cancelUrl);
        applicationContext.put("user_action", "PAY_NOW");
        orderPayload.put("payment_source", Map.of("paypal", Map.of("experience_context", applicationContext)));

        ResponseEntity<Map<String, Object>> response = payPalClient.createOrder(token, "application/json", orderPayload);
        Map<String, Object> body = response.getBody();
        
        if (body != null && body.containsKey("id")) {
            String orderId = body.get("id").toString();
            payment.setPaypalOrderId(orderId);
            
            List<Map<String, String>> links = (List<Map<String, String>>) body.get("links");
            if (links != null) {
                for (Map<String, String> link : links) {
                    if ("approve".equals(link.get("rel")) || "payer-action".equals(link.get("rel"))) {
                        return link.get("href");
                    }
                }
            }
        }
        throw new RuntimeException("Error creando orden en PayPal");
    }

    @Override
    public boolean validatePayment(Payment payment) throws Exception {
        if (payment.getPaypalOrderId() == null) return false;
        String token = getAccessToken();
        
        ResponseEntity<Map<String, Object>> response = payPalClient.getOrder(token, payment.getPaypalOrderId());
        Map<String, Object> body = response.getBody();
        
        if (body != null) {
            String status = (String) body.get("status");
            if ("COMPLETED".equals(status)) {
                return true;
            } else if ("APPROVED".equals(status)) {
                // Capturar el pago si el usuario lo aprobó
                ResponseEntity<Map<String, Object>> captureResponse = payPalClient.captureOrder(token, "application/json", payment.getPaypalOrderId());
                Map<String, Object> captureBody = captureResponse.getBody();
                if (captureBody != null && "COMPLETED".equals(captureBody.get("status"))) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    public boolean refundPayment(Payment payment, BigDecimal amount, String reason) throws Exception {
        return false;
    }
}
