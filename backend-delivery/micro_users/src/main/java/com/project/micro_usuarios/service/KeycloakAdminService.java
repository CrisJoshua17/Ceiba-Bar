package com.project.micro_usuarios.service;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.project.micro_usuarios.model.User;

import jakarta.ws.rs.core.Response;
import lombok.extern.log4j.Log4j2;

import java.util.Collections;

@Service
@Log4j2
public class KeycloakAdminService {

    @Value("${keycloak.admin.server-url}")
    private String serverUrl;

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Value("${keycloak.admin.client-id}")
    private String clientId;

    @Value("${keycloak.admin.client-secret}")
    private String clientSecret;

    private Keycloak getInstance() {
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm)
                .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                .clientId(clientId)
                .clientSecret(clientSecret)
                .build();
    }

    public String createUserInKeycloak(User user) throws Exception {
        Keycloak keycloak = getInstance();
        RealmResource realmResource = keycloak.realm(realm);
        UsersResource usersResource = realmResource.users();

        // 1. Crear el UserRepresentation
        UserRepresentation kcUser = new UserRepresentation();
        // Usamos el correo electrónico completo como username para evitar errores de longitud
        kcUser.setUsername(user.getEmail());
        kcUser.setEmail(user.getEmail());
        kcUser.setFirstName(user.getName());
        kcUser.setLastName(user.getLastName());
        kcUser.setEnabled(true);
        kcUser.setEmailVerified(true);

        // 2. Establecer contraseña
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(user.getPassword());
        credential.setTemporary(false); 
        kcUser.setCredentials(Collections.singletonList(credential));

        // 3. Crear usuario en Keycloak
        Response response = usersResource.create(kcUser);
        if (response.getStatus() != 201) {
            String error = response.readEntity(String.class);
            log.error("Error al crear usuario en Keycloak: " + response.getStatus() + " " + error);
            throw new RuntimeException("Error en Keycloak: " + error);
        }

        // Obtener el ID que generó Keycloak (viene en el header 'Location')
        String path = response.getLocation().getPath();
        String userId = path.substring(path.lastIndexOf('/') + 1);

        // 4. Asignar rol
        String roleName = user.getRole().name(); // "DRIVER" o "ADMIN"
        try {
            RoleRepresentation realmRole;
            try {
                realmRole = realmResource.roles().get(roleName).toRepresentation();
            } catch (jakarta.ws.rs.NotFoundException e) {
                // Si el rol no existe, lo creamos dinámicamente
                log.info("El rol {} no existe en Keycloak. Creándolo automáticamente...", roleName);
                RoleRepresentation newRole = new RoleRepresentation();
                newRole.setName(roleName);
                realmResource.roles().create(newRole);
                realmRole = realmResource.roles().get(roleName).toRepresentation();
            }
            usersResource.get(userId).roles().realmLevel().add(Collections.singletonList(realmRole));
        } catch (Exception e) {
            log.error("No se pudo asignar el rol " + roleName + " al usuario " + userId, e);
            throw new RuntimeException("Usuario creado pero error al asignar el rol en Keycloak.");
        }

        log.info("Usuario creado exitosamente en Keycloak con UUID: {} y rol: {}", userId, roleName);
        return userId;
    }
}
