import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

constructor(
    private router: Router,
    private keycloakService: KeycloakService
  ) {}

private roleRoutes: Record<string, string> = {
  'ADMIN': '/admin/dashboard',
  'CUSTOMER': '/customer/dashboard',
  'DRIVER': '/drivers/dashboard'
};

/**
 * Redirige al dashboard correspondiente según el rol de Keycloak.
 * Llamar después de que Keycloak confirme la autenticación.
 */
redirectAfterLogin(): void {
  const role = this.keycloakService.getPrimaryRole();
  const route = role ? (this.roleRoutes[role] ?? '/home') : '/home';
  this.router.navigate([route]);
}

  getRouteByRole(role: string): string {
    return this.roleRoutes[role] ?? '/home';
  }

}
