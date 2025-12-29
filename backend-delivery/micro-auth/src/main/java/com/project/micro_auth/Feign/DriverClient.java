package com.project.micro_auth.Feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.project.micro_auth.model.dto.DriverDto;

@FeignClient(name="micro-drivers")
public interface DriverClient {
    
     @GetMapping("/api/drivers/internal/user/{userId}")
    DriverDto findByUserId(@PathVariable Long userId);
}
