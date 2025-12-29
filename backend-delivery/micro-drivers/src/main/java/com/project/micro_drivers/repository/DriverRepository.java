package com.project.micro_drivers.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.micro_drivers.model.Driver;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

  Optional<Driver> findByUserId(Long UserId);

  Optional<Driver> findByUserEmail(String userEmail);

}
