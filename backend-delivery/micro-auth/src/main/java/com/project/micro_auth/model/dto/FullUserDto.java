package com.project.micro_auth.model.dto;

import lombok.Data;

@Data
public class FullUserDto {
    
    private UserFormDto user;

    // nulos según role
    private DriverDto driver;

    private CustomerDto customer;
}
