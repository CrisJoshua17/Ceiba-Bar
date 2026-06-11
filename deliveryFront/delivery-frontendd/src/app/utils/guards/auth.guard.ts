import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from '../../services/keycloak.service';

/**
 * Guard de autenticación: redirige a Keycloak Login
 * si el usuario no está autenticado.
 *
 * Uso en routes:
 *   canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);

  if (keycloak.isLoggedIn()) {
    return true;
  }

  // Redirigir a Keycloak Login conservando la URL destino
  keycloak.login(window.location.href);
  return false;
};
