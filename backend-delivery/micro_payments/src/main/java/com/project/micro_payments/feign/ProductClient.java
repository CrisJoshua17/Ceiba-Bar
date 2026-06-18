package com.project.micro_payments.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.Map;

@FeignClient(name = "micro-productos", path = "/api/products")
public interface ProductClient {

    @GetMapping("/{id}")
    Map<String, Object> getProductById(@PathVariable("id") Long id);
}
