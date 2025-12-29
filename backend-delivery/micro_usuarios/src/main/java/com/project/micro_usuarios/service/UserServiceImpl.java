package com.project.micro_usuarios.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.project.micro_usuarios.model.Role;
import com.project.micro_usuarios.model.User;
import com.project.micro_usuarios.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import com.project.micro_usuarios.model.Role;

@Service
@RequiredArgsConstructor
@Log4j2
public class UserServiceImpl implements UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User createUser(User user) {
        if (repository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado: " + user.getEmail());
        }

        // ¡IMPORTANTE! Encriptar la contraseña antes de guardar
        String encryptedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encryptedPassword);
        log.info("Contraseña encriptada para usuario: {}", user.getEmail());

        // Asignar rol por defecto si no viene
        if (user.getRole() == null) {
            user.setRole(Role.CUSTOMER);
        }

        User savedUser = repository.save(user);
        log.info("Usuario creado exitosamente: ID={}", savedUser.getId());

        return savedUser;
    }

    @Override
    public Optional<User> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<User> findAll() {
        return repository.findAll();
    }

    @Override
    public User update(User user) {
        User userdb = repository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Error al encontrar al Usuario con id: " + user.getId()));
        userdb.setEmail(user.getEmail());
        userdb.setLastName(user.getLastName());
        userdb.setName(user.getName());
        userdb.setPhone(user.getPhone());
        userdb.setImage(user.getImage());
        log.info("Usuario actualizado - Image: {}", userdb.getImage());
        log.info("Usuario actualizado - Phone: {}", userdb.getPhone());
        return repository.save(userdb);
    }

    @Override
    public void delete(Long id) {
        User userdb = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error al encontrar al Usuario con id: " + id));
        repository.deleteById(userdb.getId());

    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(email);
    }

    public boolean existsAdmin() {
        return repository.findByRole(Role.ADMIN).isPresent();
    }

    @Override
    public List<User> findAllByRole(Role role) {
        return repository.findAllByRole(role);
    }

}
