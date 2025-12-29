package com.project.micro_payments.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.project.micro_payments.dto.OrderDto;

import reactor.core.publisher.Mono;

@FeignClient(name = "micro-realtime", path = "/api/orders")
public interface OrderClient {

    @PostMapping
    public Mono<ResponseEntity<?>> create(@RequestBody OrderDto order);

}
