package com.project.micro_realtime.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryAddress {

    private String street;
    private String colonia;
    private String city;

    @Column(name = "postal_code")
    private String postalCode;
    private String reference; // "Casa azul, portón negro"
}
