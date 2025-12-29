package com.project.micro_customer.validation;

import java.util.Arrays;
import java.util.List;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;


public class CiudadMexicoValidator implements ConstraintValidator<CiudadMexico, String> {
    
    private static final List<String> CIUDADES_VALIDAS = Arrays.asList(
        "cdmx", "ciudad de mexico", "ciudad de méxico", 
        "mexico city", "ciudad de mexico d.f.", "ciudad de méxico d.f."
    );

    @Override
    public boolean isValid(String ciudad, ConstraintValidatorContext context) {
        if (ciudad == null) {
            return false;
        }
        
        String ciudadNormalizada = ciudad.trim().toLowerCase();
        
        return CIUDADES_VALIDAS.stream()
                .anyMatch(ciudadValida -> ciudadNormalizada.equals(ciudadValida));
    }
}