package com.project.micro_drivers.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.project.micro_drivers.model.Driver;
import com.project.micro_drivers.repository.DriverRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverRepository repository;

    @Override
    public Driver createDriver(Driver driver) {
        return repository.save(driver);
    }

    @Override
    public Driver save(Driver driver) {
        return repository.save(driver);
    }

    @Override
    public Optional<Driver> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<Driver> findAll() {
        return repository.findAll();
    }

    @Override
    public Driver update(Driver driver) {
        Driver driverDb = repository.findById(driver.getId())
                .orElseThrow(() -> new RuntimeException("Error al encontrar el Driver con id: " + driver.getId()));
        driverDb.setMotoId(driver.getMotoId());
        driverDb.setLicensePlate(driver.getLicensePlate());
        driverDb.setLicenseNumber(driver.getLicenseNumber());
        return repository.save(driverDb);
    }

    @Override
    public void delete(Long id) {
        Driver driverDb = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error al encontrar el Driver con id: " + id));
        repository.deleteById(id);
    }

    @Override
    public Optional<Driver> findByUserId(Long userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public Optional<Driver> findByUserEmail(String email) {
        return repository.findByUserEmail(email);
    }

}
