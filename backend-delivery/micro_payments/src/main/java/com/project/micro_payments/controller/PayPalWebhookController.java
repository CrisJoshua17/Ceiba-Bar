package com.project.micro_payments.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.micro_payments.dto.OrderDto;
import com.project.micro_payments.feign.OrderClient;
import com.project.micro_payments.model.Payment;
import com.project.micro_payments.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments/webhook")
@RequiredArgsConstructor
public class PayPalWebhookController {

    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/paypal")
    public ResponseEntity<String> handlePayPalWebhook(
            @RequestHeader Map<String, String> headers,
            @RequestBody String payload) {
        
        try {
            JsonNode rootNode = objectMapper.readTree(payload);
            String eventType = rootNode.path("event_type").asText();
            
            // "CHECKOUT.ORDER.APPROVED" happens when the user approves the payment on PayPal.
            if ("CHECKOUT.ORDER.APPROVED".equals(eventType) || "PAYMENT.CAPTURE.COMPLETED".equals(eventType)) {
                JsonNode resource = rootNode.path("resource");
                
                String orderId;
                if ("PAYMENT.CAPTURE.COMPLETED".equals(eventType)) {
                    // For capture, the original order ID might be stored differently, but let's try to get supplementary data
                    JsonNode supplementaryData = resource.path("supplementary_data");
                    if (!supplementaryData.isMissingNode() && !supplementaryData.path("related_ids").path("order_id").isMissingNode()) {
                        orderId = supplementaryData.path("related_ids").path("order_id").asText();
                    } else {
                        return ResponseEntity.ok("Ignored capture without order_id");
                    }
                } else {
                    orderId = resource.path("id").asText();
                }
                
                var paymentOpt = paymentRepository.findByPaypalOrderId(orderId);
                if (paymentOpt.isPresent()) {
                    Payment payment = paymentOpt.get();
                    if (!com.project.micro_payments.model.enums.PaymentStatus.COMPLETED.equals(payment.getStatus())) {
                        payment.setStatus(com.project.micro_payments.model.enums.PaymentStatus.COMPLETED);
                        payment.setUpdatedAt(java.time.LocalDateTime.now());
                        paymentRepository.save(payment);
                        
                        // Emitir la orden
                        if (payment.getTempOrderData() != null) {
                            try {
                                OrderDto dto = objectMapper.readValue(payment.getTempOrderData(), OrderDto.class);
                                orderClient.create(dto).subscribe();
                            } catch (Exception e) {
                                System.err.println("Error creando la orden PayPal: " + e.getMessage());
                            }
                        }
                    }
                }
            }
            return ResponseEntity.ok("Received");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error parsing webhook");
        }
    }
}
