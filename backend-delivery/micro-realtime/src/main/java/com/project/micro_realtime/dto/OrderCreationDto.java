package com.project.micro_realtime.dto;

import java.util.List;
import com.project.micro_realtime.model.OrderStatus;
import lombok.Data;

@Data
public class OrderCreationDto {
    private Long id;
    private String userId;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String address;
    private Double destinationLat;
    private Double destinationLng;
    private List<ProductDto> products;
    private OrderStatus status = OrderStatus.CREATED;

    private Double subtotal;
    private Double deliveryFee;
    private Double discount;
    private Double tip;
    private Double total;
    private String paymentMethod;
}
