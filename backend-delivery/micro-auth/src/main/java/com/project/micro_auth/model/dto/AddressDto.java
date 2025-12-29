package com.project.micro_auth.model.dto;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
public class AddressDto {
    private Long id;
    private String alias;
    private String street;
    private String colonia;
    private String city;
    private String state;
    private String delegacion;
    private String postalCode;
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<CustomerDto> customers;

    private String instructions;

    private Boolean isDefault = false;
}
