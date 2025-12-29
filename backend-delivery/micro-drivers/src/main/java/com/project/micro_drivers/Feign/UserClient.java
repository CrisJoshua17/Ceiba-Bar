package com.project.micro_drivers.Feign;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.project.micro_drivers.model.dto.UserDto;
import com.project.micro_drivers.model.dto.Role;

@FeignClient(name = "micro-usuarios")
public interface UserClient {

    @GetMapping("/api/users/{id}")
    UserDto getUserById(@PathVariable Long id);

    @GetMapping("/api/users/internal/{id}")
    UserDto getUserByIdInternal(@PathVariable Long id);

    @GetMapping("/api/users/role/{role}")
    List<UserDto> findAllByRole(@PathVariable Role role);

}