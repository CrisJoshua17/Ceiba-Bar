package com.project.micro_productos.model.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
}