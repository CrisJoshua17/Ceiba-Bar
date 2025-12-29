package com.project.micro_drivers.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Table(name = "drivers")
@Data
public class Driver {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id")
  private Long userId;

  @Column(name = "user_email")
  private String userEmail;

  private String motoId;

  private String licensePlate;
  private String licenseNumber;
  private Double rating = 0.0;
  private Integer totalDeliveries = 0;
  private LocalDateTime registrationDate;
}
