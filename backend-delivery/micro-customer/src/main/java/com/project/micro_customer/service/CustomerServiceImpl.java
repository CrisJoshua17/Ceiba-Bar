package com.project.micro_customer.service;

import java.sql.Driver;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.project.micro_customer.Feign.UserClient;
import com.project.micro_customer.model.Address;
import com.project.micro_customer.model.Customer;
import com.project.micro_customer.model.dto.UserDto;
import com.project.micro_customer.repository.CustomerRespository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {


    private final CustomerRespository repository;
     private final UserClient userClient;


    @Override
    public Customer save(Customer customer) {
          // Validar que el usuario exista
        UserDto user = userClient.getUserByIdInternal(customer.getUserId());
        if (user == null) {
            throw new RuntimeException("Usuario no encontrado con id: " + customer.getUserId());
        }

        // Validar que tenga rol CONSUMER
       if (!"CUSTOMER".equalsIgnoreCase(user.getRole()) && !"ADMIN".equalsIgnoreCase(user.getRole())) {
    throw new RuntimeException("El usuario no tiene rol CUSTOMER o ADMIN");
}
            // Verificar que no exista ya un customer para este usuario
        if (repository.findByUserId(customer.getUserId()).isPresent()) {
            throw new RuntimeException("Ya existe un customer para el usuario ID: " + customer.getUserId());
        }

        return repository.save(customer);
    }


    @Override
    public Optional<Customer> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<Customer> findAll() {
        return repository.findAll();
    }

    @Override
    public Customer update(Customer customer) {
        Customer customerDb = repository.findById(customer.getId())
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + customer.getId()));
        
        customerDb.setAddresses(customer.getAddresses());
        
        // Actualizar otros campos si es necesario
        if (customer.getTotalOrders() != null) {
            customerDb.setTotalOrders(customer.getTotalOrders());
        }
        if (customer.getTotalSpent() != null) {
            customerDb.setTotalSpent(customer.getTotalSpent());
        }
        if (customer.getLastOrderDate() != null) {
            customerDb.setLastOrderDate(customer.getLastOrderDate());
        }
        
        return repository.save(customerDb);
    }


    @Override
    public void delete(Long id) {
         repository.findById(id)
         .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + id));
               repository.deleteById(id);
    }


       @Override
    public Optional<Customer> findByUserId(Long userId) {
    return repository.findByUserId(userId);
}

public Customer addOrder(Long customerId, Double orderAmount) {
        Customer customer = repository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + customerId));
        
        customer.addOrder(orderAmount);
        return repository.save(customer);
    }
   
    
}
