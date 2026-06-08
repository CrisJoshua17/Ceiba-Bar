package com.project.micro_customer.model;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.micro_customer.validation.CiudadMexico;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address extends BaseEntity {

    private String alias;

    @NotBlank
    private String street;

    @NotBlank
    private String colonia;

    @NotBlank
    @CiudadMexico
    private String city;

    @NotBlank
    private String state;

    @NotBlank
    private String delegacion;

    @NotBlank
    private String postalCode;

    private String instructions;
    
    @Builder.Default
    private Boolean isDefault = false;
    private Double latitude;
    private Double longitude;

    @ManyToMany(mappedBy = "addresses")
    @Builder.Default
    private List<Customer> customers = new ArrayList<>();

}
