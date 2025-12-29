package com.project.micro_customer.model.dto;

import lombok.Data;

@Data
public class UserDto {
    
    private Long id;
    private String name;
    private String lastName;
    private String email;
    private String role;
    
}
