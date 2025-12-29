package com.project.micro_auth.model.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ApiResponse<T> {
    
     private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public void ok(String message, T data) {
        this.success = true;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    public void error(String message) {
        this.success = false;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

}
