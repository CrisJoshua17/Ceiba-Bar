package com.project.micro_realtime.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import com.project.micro_realtime.dto.DriverDto;

@FeignClient(name = "micro-drivers", path = "/api/drivers")
public interface DriverClient {

    @GetMapping("/{id}")
    DriverDto getDriverById(@PathVariable Long id);

    @PutMapping("/{id}/increment-deliveries")
    void incrementDeliveries(@PathVariable Long id);
}
