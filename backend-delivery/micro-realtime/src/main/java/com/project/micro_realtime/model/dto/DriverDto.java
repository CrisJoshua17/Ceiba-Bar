package com.project.micro_realtime.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverDto {

    private Long id;
    private Long userId;
    private String userEmail;
    private String motoId;
    private String licensePlate;
    private String licenseNumber;
    private Double rating;
    private Integer totalDeliveries;
}
