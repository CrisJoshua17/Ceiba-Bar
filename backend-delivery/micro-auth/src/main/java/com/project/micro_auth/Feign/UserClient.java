package com.project.micro_auth.Feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.project.micro_auth.model.dto.ApiResponse;
import com.project.micro_auth.model.dto.UserDto;
import com.project.micro_auth.model.dto.UserFormDto;

@FeignClient(name="micro-usuarios")
public interface UserClient {
    
      @GetMapping("/api/users/internal/email/{email}")
      UserDto findByEmail(@PathVariable String email);

      

}
