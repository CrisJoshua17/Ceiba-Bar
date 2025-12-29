package com.project.micro_customer.service;

import java.util.List;
import java.util.Optional;

import com.project.micro_customer.model.Customer;

public interface  CustomerService {
    
     Customer save(Customer customer);
     Optional<Customer> findById(Long id);
     List<Customer> findAll();
     Customer update(Customer customer);
     void delete(Long id);
     Optional<Customer> findByUserId(Long UserId);
}
