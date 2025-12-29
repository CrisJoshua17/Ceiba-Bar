package com.project.micro_auth.model.dto;

import java.util.Set;

import lombok.Data;

@Data
public class CustomerDto  {
       private Long id;
    private Long userId;
    private Integer totalOrders;
    private Set<AddressDto> addresses;
}
