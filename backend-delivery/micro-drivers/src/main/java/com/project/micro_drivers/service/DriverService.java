package com.project.micro_drivers.service;

import java.util.List;
import java.util.Optional;

import com.project.micro_drivers.model.Driver;

public interface DriverService {

     Driver createDriver(Driver driver);

     Driver save(Driver driver);

     Optional<Driver> findById(Long id);

     List<Driver> findAll();

     Driver update(Driver driver);

     void delete(Long id);

     Optional<Driver> findByUserEmail(String email);

     Optional<Driver> findByUserId(Long userId);

}
