package com.project.micro_realtime.model;

import java.time.LocalDateTime;

import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.persistence.Id;
import lombok.Data;

@Data
@Document(collection="tracking")
public class OrderTracking {

    @Id
    private String id;
    private Long orderId;
    private String status;
    private String driverId;
    private LocalDateTime timestamp;
    private Double lat;
    private Double lng;

    private Double deliveryLat;
    private Double deliveryLng;
    
}
