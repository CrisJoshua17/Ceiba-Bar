package com.project.micro_productos.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;


@Entity
@Table(name = "drinks")
@PrimaryKeyJoinColumn(name = "product_id")
@EqualsAndHashCode(callSuper = true)
@Data
public class Drink  extends Product {

    @Enumerated(EnumType.STRING)
    @NotNull
    private DrinkType type; // ALCOHOLIC, NON_ALCOHOLIC

}