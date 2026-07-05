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
import com.project.micro_payments.model.ProcessedEvent;
import com.project.micro_payments.repository.PaymentRepository;
import com.project.micro_payments.repository.ProcessedEventRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments/webhook")
@RequiredArgsConstructor
public class PayPalWebhookController {

    private final PaymentRepository paymentRepository;
    private final ProcessedEventRepository processedEventRepository;
    private final OrderClient orderClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/paypal")
    public ResponseEntity<String> handlePayPalWebhook(
            @RequestHeader Map<String, String> headers,
            @RequestBody String payload) {
        
        try {
            JsonNode rootNode = objectMapper.readTree(payload);
            String eventId = rootNode.path("id").asText();
            if (eventId != null && !eventId.isEmpty() && processedEventRepository.existsById(eventId)) {
                return ResponseEntity.ok("Event already processed");
            }
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
                        
                        if (eventId != null && !eventId.isEmpty()) {
                            processedEventRepository.save(ProcessedEvent.builder()
                                    .id(eventId)
                                    .provider("PAYPAL")
                                    .processedAt(java.time.Instant.now())
                                    .build());
                        }
                        
                        // Emitir la orden
                        if (payment.getTempOrderData() != null) {
                            try {
                                OrderDto dto = objectMapper.readValue(payment.getTempOrderData(), OrderDto.class);
                                dto.setTotal(payment.getAmount().doubleValue());
                                dto.setSubtotal(payment.getAmount().doubleValue());
                                dto.setDeliveryFee(0.0);
                                dto.setDiscount(0.0);
                                dto.setTip(0.0);
                                dto.setPaymentMethod(payment.getMethod().name().toLowerCase());
                                java.util.Map<String, Object> res = orderClient.create(dto);
                                if (res != null && res.get("data") != null) {
                                    java.util.Map<String, Object> data = (java.util.Map<String, Object>) res.get("data");
                                    if (data.containsKey("id")) {
                                        payment.setOrderId(Long.valueOf(data.get("id").toString()));
                                        paymentRepository.save(payment);
                                    }
                                }
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
