package com.project.micro_drivers.model.dto;

import lombok.Data;

@Data
public class UserDto {
    
    private String id;
    private String name;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    private byte[] image;
}
