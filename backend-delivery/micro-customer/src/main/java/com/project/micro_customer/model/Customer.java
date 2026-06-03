package com.project.micro_customer.model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
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
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId; // Referencia al User en micro-usuarios

    @Column(name = "user_email", unique = true)
    private String userEmail;

    // Un cliente puede tener muchas direcciones,varios clientes pueden compartir la
    // misma dirección (ej: familia)
    @ManyToMany(fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE, CascadeType.DETACH })
    @JoinTable(name = "customer_addresses", joinColumns = @JoinColumn(name = "customer_id"), inverseJoinColumns = @JoinColumn(name = "address_id"))
    private List<Address> addresses = new ArrayList<>();

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