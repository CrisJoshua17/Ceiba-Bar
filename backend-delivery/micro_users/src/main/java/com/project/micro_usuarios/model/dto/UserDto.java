package com.project.micro_usuarios.model.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String name;
    private String lastName;
    private String email;
    private String password;
    private String role;
    private Long phone;
    private String image;
}
