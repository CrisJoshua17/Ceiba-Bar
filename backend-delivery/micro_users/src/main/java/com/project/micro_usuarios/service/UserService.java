package com.project.micro_usuarios.service;

import java.util.List;
import java.util.Optional;

import com.project.micro_usuarios.model.Role;
import com.project.micro_usuarios.model.User;

public interface UserService {

    User createUser(User user);

    Optional<User> findById(Long id);

    List<User> findAll();

    User update(User user);

    void delete(Long id);

    Optional<User> findByEmail(String email);

    List<User> findAllByRole(Role role);

}
