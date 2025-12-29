package com.project.micro_productos.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.io.File;

import org.springframework.web.multipart.MultipartFile;

@Data
public class ProductRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String description;

    @NotNull
    @Positive
    private Double price;
    private Boolean available;

    @NotBlank
    private String type; // "DRINK", "SNACK", "RECETARIO"

    // Solo requerido cuando type = "DRINK"
    private String drinkType; // "ALCOHOLIC", "NON_ALCOHOLIC"

    private MultipartFile image;

}