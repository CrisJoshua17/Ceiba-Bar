package com.project.micro_customer.model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Table(name = "customers")
@Data
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_email")
    private String userEmail;

    // Un cliente puede tener muchas direcciones
    @ManyToMany(fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE, CascadeType.DETACH })
    @JoinTable(name = "customer_addresses", joinColumns = @JoinColumn(name = "customer_id"), inverseJoinColumns = @JoinColumn(name = "address_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Address> addresses = new HashSet<>();
    @Column(name = "total_orders")
    private Integer totalOrders = 0;

    @Column(name = "total_spent")
    private Double totalSpent = 0.0;

    @Column(name = "member_since")
    private LocalDateTime memberSince;

    @Column(name = "last_order_date")
    private LocalDateTime lastOrderDate;

    // Métodos de utilidad
    public void addOrder(Double amount) {
        this.totalOrders++;
        this.totalSpent += amount;
        this.lastOrderDate = LocalDateTime.now();
    }

}