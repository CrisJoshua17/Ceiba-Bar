package com.project.micro_customer.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;



@Documented
@Constraint(validatedBy = CiudadMexicoValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface CiudadMexico {
    String message() default "La ciudad debe ser CDMX o Ciudad de México";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}