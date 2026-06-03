package com.project.micro_productos.model.dto;

import lombok.Data;

@Data
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private Boolean available;
    private String image;
    private String type; // "DRINK", "SNACK", "RECETARIO"
    private String drinkType; // "ALCOHOLIC", "NON_ALCOHOLIC" (solo para bebidas)
}