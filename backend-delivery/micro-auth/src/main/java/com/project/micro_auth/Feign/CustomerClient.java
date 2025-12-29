package com.project.micro_auth.Feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.project.micro_auth.model.dto.CustomerDto;

@FeignClient(name = "micro-customer", path = "/api/customers")
public interface CustomerClient {
    @GetMapping("/internal/user/{userId}")
    CustomerDto findByUserId(@PathVariable Long userId);
}
