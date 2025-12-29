package com.project.micro_realtime.event;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusEvent {
    

    private Long orderId;
    private String status;
    private String driverId;
    private LocalDateTime timestamp;
    private Double lat;
    private Double lng;
    private Double deliveryLat;
    private Double deliveryLng;

    public OrderStatusEvent(Long orderId, String status, String driverId, 
                           LocalDateTime timestamp, Double lat, Double lng) {
        this.orderId = orderId;
        this.status = status;
        this.driverId = driverId;
        this.timestamp = timestamp;
        this.lat = lat;
        this.lng = lng;
        this.deliveryLat = null;
        this.deliveryLng = null;
    }



}
