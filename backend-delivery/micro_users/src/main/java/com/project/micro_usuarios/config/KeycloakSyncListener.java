package com.project.micro_usuarios.config;

import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import com.project.micro_usuarios.Feign.CustomerClient;
import com.project.micro_usuarios.model.Role;
import com.project.micro_usuarios.model.User;
import com.project.micro_usuarios.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import java.util.Optional;
import java.util.Map;
import java.util.List;

@Component
@RequiredArgsConstructor
@Log4j2
public class KeycloakSyncListener implements ApplicationListener<AuthenticationSuccessEvent> {

    private final UserRepository userRepository;
    private final CustomerClient customerClient;
    private final com.project.micro_usuarios.Feign.DriverClient driverClient;

    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        if (event.getAuthentication() instanceof JwtAuthenticationToken jwtAuth) {
            String userId = jwtAuth.getToken().getSubject(); // UUID de Keycloak

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.info("Sincronizando nuevo usuario desde Keycloak: {}", userId);
                
                String email = jwtAuth.getToken().getClaimAsString("email");
                String name = jwtAuth.getToken().getClaimAsString("given_name");
                String lastName = jwtAuth.getToken().getClaimAsString("family_name");
                
                if (name == null) {
                    name = jwtAuth.getToken().getClaimAsString("preferred_username");
                }
                
                // Determinar el rol basado en realm_access.roles
                Role userRole = Role.CUSTOMER; // por defecto
                Map<String, Object> realmAccess = jwtAuth.getToken().getClaimAsMap("realm_access");
                if (realmAccess != null && realmAccess.containsKey("roles")) {
                    List<String> roles = (List<String>) realmAccess.get("roles");
                    if (roles.contains("ADMIN")) {
                        userRole = Role.ADMIN;
                    } else if (roles.contains("DRIVER")) {
                        userRole = Role.DRIVER;
                    }
                }

                User newUser = new User();
                newUser.setId(userId);
                newUser.setEmail(email);
                newUser.setName(name != null ? name : "Unknown");
                newUser.setLastName(lastName != null ? lastName : "");
                newUser.setPassword("N/A"); // Keycloak maneja el password
                newUser.setRole(userRole);

                userRepository.save(newUser);
                log.info("Usuario guardado en BD local: {}", email);

                // Si es CUSTOMER, intentar crear perfil en micro_customer
                if (userRole == Role.CUSTOMER) {
                    try {
                        customerClient.createCustomerProfile(userId, email);
                        log.info("Perfil de customer creado automáticamente en micro_customer para: {}", email);
                    } catch (Exception e) {
                        log.error("Error creando perfil en micro_customer: {}", e.getMessage());
                    }
                } else if (userRole == Role.DRIVER) {
                    try {
                        driverClient.createDriverProfile(userId, email);
                        log.info("Perfil de driver creado automáticamente en micro_driver para: {}", email);
                    } catch (Exception e) {
                        log.error("Error creando perfil de driver: {}", e.getMessage());
                    }
                }
            }
        }
    }
}
