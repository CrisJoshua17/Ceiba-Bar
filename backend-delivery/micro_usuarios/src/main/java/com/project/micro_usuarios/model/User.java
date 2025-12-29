package com.project.micro_usuarios.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Entity
@Table(name="users")
@Data
public class User {
    

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @NotBlank
    @Column(name="lastname")
    private String lastName;


    @Email
    @NotEmpty
    @Column(unique=true)
    private String email;

    @NotBlank
    private String password;

    private Long phone;

    private String image;

    @Enumerated(EnumType.STRING)
    private Role role;

    

}
