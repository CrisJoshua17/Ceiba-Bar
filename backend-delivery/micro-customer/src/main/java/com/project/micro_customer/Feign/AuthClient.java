package com.project.micro_customer.Feign;

import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "micro-auth", path = "/api/auth")
public interface AuthClient {
    
    @PostMapping("/validate-admin")
    boolean validateAdminToken(@RequestHeader("Authorization") String authHeader);
    
    @PostMapping("/validate-role/{role}")
    boolean validateRole(@RequestHeader("Authorization") String authHeader, 
                        @PathVariable String role);
    
    @GetMapping("/user-info")
    Map<String, Object> getUserInfo(@RequestHeader("Authorization") String authHeader);
    
    @PostMapping("/validate-token")
    boolean validateToken(@RequestHeader("Authorization") String authHeader);
    
}