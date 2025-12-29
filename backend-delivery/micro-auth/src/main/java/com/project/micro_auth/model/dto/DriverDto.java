package com.project.micro_auth.model.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class DriverDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String motoId;
    private Long phone;
    private byte[] image;
    private String licensePlate;
    private String licenseNumber;
    private Double rating = 0.0;
    private Integer totalDeliveries = 0;
    private LocalDateTime registrationDate;
}