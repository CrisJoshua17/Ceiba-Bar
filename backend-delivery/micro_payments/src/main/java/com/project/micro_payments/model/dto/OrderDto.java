package com.project.micro_payments.dto;

import java.util.List;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;

@Data
public class OrderDto {

    private Long id;

    private Long userId;
    private String customerName;
    private String customerEmail;
    private String address;
    private Double destinationLat;
    private Double destinationLng;
    private List<ProductDto> products;
    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.CREATED;
}
