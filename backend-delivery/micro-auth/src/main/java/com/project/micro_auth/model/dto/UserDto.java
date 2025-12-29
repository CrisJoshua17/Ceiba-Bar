package com.project.micro_auth.model.dto;

import lombok.Data;

@Data
public class UserDto {
    
    private Long id;
    private String name;
    private String lastName;
    private String email;
    private String password;
    private String role;
     private String phone;
     private String image;
}
