import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from '../../services/keycloak.service';

/**
 * Guard de autorización por rol.
 *
 * Uso en routes:
 *   canActivate: [roleGuard('ADMIN')]
 *   canActivate: [roleGuard('ADMIN', 'DRIVER')]   // múltiples roles permitidos
 *
 * Si el usuario no está logueado → redirige a Keycloak Login.
 * Si está logueado pero sin el rol → redirige a /home.
 */
export const roleGuard = (...allowedRoles: string[]): CanActivateFn => {
  return () => {
    const keycloak = inject(KeycloakService);
    const router = inject(Router);

    // Primero verificar autenticación
    if (!keycloak.isLoggedIn()) {
      keycloak.login(window.location.href);
      return false;
    }

    // Verificar rol
    const userRoles = keycloak.getRoles();
    const hasAccess = allowedRoles.some(role => userRoles.includes(role));

    if (!hasAccess) {
      // Redirigir según rol del usuario
      const primaryRole = keycloak.getPrimaryRole();
      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        DRIVER: '/drivers/dashboard',
        CUSTOMER: '/customer/dashboard',
      };
      const redirectTo = primaryRole ? roleRoutes[primaryRole] : '/home';
      router.navigate([redirectTo]);
      return false;
    }

    return true;
  };
};
