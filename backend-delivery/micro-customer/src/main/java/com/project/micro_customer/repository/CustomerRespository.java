package com.project.micro_customer.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.micro_customer.model.Address;
import com.project.micro_customer.model.Customer;

@Repository
public interface CustomerRespository extends JpaRepository<Customer, Long> {
    
  Optional<Customer> findByUserId(Long UserId);

}
