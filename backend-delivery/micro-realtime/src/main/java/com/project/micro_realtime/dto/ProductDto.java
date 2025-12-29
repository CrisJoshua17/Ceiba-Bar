package com.project.micro_realtime.dto;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class ProductDto {

    private Long id;
    private String name;
    private String description;
    private Double price;
    private String image;
    private Boolean available = true;

}
