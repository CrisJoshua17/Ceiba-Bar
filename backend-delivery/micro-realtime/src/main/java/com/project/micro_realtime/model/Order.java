package com.project.micro_realtime.model;

import java.time.LocalDateTime;
import java.util.List;

import com.project.micro_realtime.dto.ProductDto;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "orders")
@Data
public class Order {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   private Long userId;
   private String customerName;
   private String customerEmail;
   private String address;
   private Double destinationLat;
   private Double destinationLng;

   @ElementCollection(fetch = FetchType.EAGER)
   @CollectionTable(name = "order_products", joinColumns = @JoinColumn(name = "order_id"))
   private List<ProductDto> products;

   @Enumerated(EnumType.STRING)
   private OrderStatus status = OrderStatus.CREATED;

   // ========== RATING FIELDS ==========
   @Column(name = "rating")
   private Integer rating; // 1-5 estrellas

   @Column(name = "feedback", length = 500)
   private String feedback; // Comentario del cliente

   @Column(name = "rated_at")
   private LocalDateTime ratedAt; // Fecha de calificación

}
