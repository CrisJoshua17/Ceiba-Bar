package com.project.micro_realtime.model;

import java.time.LocalDateTime;
import java.util.List;

import com.project.micro_realtime.dto.ProductDto;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Embedded;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.CascadeType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.project.micro_realtime.model.BaseEntity;

import java.math.BigDecimal;
import java.util.ArrayList;


@Entity
@Table(name = "orders", indexes = {
      @Index(name = "idx_orders_customer_status", columnList = "customer_id, status"),
      @Index(name = "idx_orders_driver_status", columnList = "driver_id, status"),
      @Index(name = "idx_orders_created", columnList = "created_at")

})
@Getter 
@Setter 
@NoArgsConstructor  
@AllArgsConstructor 
@Builder
public class Order extends BaseEntity{

   @Column(name = "customer_id")
   private Long customerId;
   @Column(name = "customer_name")
    private String customerName;    // Denormalizado (historial)
   @Column(name = "customer_email")
    private String customerEmail;   // Denormalizado (historial)
   @Column(name = "driver_id")
    private Long driverId;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.CREATED;

    @Embedded
    private DeliveryAddress deliveryAddress;

    @Column(name = "delivery_latitude")
    private Double deliveryLatitude;

    @Column(name = "delivery_longitude")
    private Double deliveryLongitude;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal tip = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    private String paymentMethod;   // "stripe" | "paypal"
    private String notes;

    private Integer rating;         // 1-5
    private String feedback;

    @Column(name = "rated_at")
    private LocalDateTime ratedAt;
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // Relación con Delivery (mismo servicio)
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Delivery delivery;

    public void nextState() {
        com.project.micro_realtime.state.OrderStateFactory.getState(this.status).next(this);
    }

    public void cancelState() {
        com.project.micro_realtime.state.OrderStateFactory.getState(this.status).cancel(this);
    }
}