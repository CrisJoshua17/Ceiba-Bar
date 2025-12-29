package com.project.micro_auth.model.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
