package com.project.micro_usuarios.Feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "micro-drivers", path = "/api/drivers")
public interface DriverClient {

    @PostMapping("/internal/create")
    void createDriverProfile(@RequestParam("userId") String userId,
            @RequestParam("userEmail") String userEmail);
}