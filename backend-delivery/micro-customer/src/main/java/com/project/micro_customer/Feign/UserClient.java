package com.project.micro_customer.Feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.project.micro_customer.model.dto.UserDto;


@FeignClient(name="micro-usuarios")
public interface UserClient {

   @GetMapping("/api/users/{id}")
    UserDto getUserById(@PathVariable Long id);
    
    @GetMapping("/api/users/internal/{id}")
    UserDto getUserByIdInternal(@PathVariable Long id);
    
}
