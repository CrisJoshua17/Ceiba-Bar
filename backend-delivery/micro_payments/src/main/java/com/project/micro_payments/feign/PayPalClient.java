package com.project.micro_payments.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;

@FeignClient(name = "paypalClient", url = "https://api-m.sandbox.paypal.com")
public interface PayPalClient {

    @PostMapping(value = "/v1/oauth2/token", consumes = "application/x-www-form-urlencoded")
    ResponseEntity<Map<String, Object>> getAccessToken(
            @RequestHeader("Authorization") String authorization,
            @RequestBody String grantType);

    @PostMapping("/v2/checkout/orders")
    ResponseEntity<Map<String, Object>> createOrder(
            @RequestHeader("Authorization") String bearerToken,
            @RequestHeader("Content-Type") String contentType,
            @RequestBody Map<String, Object> orderPayload);

    @PostMapping("/v2/checkout/orders/{id}/capture")
    ResponseEntity<Map<String, Object>> captureOrder(
            @RequestHeader("Authorization") String bearerToken,
            @RequestHeader("Content-Type") String contentType,
            @PathVariable("id") String orderId);
            
    @GetMapping("/v2/checkout/orders/{id}")
    ResponseEntity<Map<String, Object>> getOrder(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable("id") String orderId);

}
