package com.project.micro_usuarios.Feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "micro-customer")
public interface CustomerClient {
    
     @PostMapping("/api/customers/internal/create")
    void createCustomerProfile(@RequestParam("userId") Long userId, 
                              @RequestParam("userEmail") String userEmail);
}
