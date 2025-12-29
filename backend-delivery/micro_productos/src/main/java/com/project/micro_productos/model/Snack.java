package com.project.micro_productos.model;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "snacks")
@PrimaryKeyJoinColumn(name = "product_id")
@EqualsAndHashCode(callSuper = true)
@Data
public class Snack extends Product{
    

}
