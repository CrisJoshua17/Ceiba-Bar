import { Injectable } from '@angular/core';
import { KeycloakService } from './keycloak.service';

/**
 * AuthService — Fachada de autenticación.
 *
 * Antes gestionaba el login con JWT propio (localStorage).
 * Ahora delega todo a KeycloakService.
 *
 * Mantiene la interfaz pública para no romper componentes existentes
 * que inyecten este servicio.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private keycloakService: KeycloakService) {}

  /** Redirige al login de Keycloak */
  login(): void {
    this.keycloakService.login();
  }

  /** Cierra la sesión en Keycloak */
  logout(): void {
    this.keycloakService.logout();
  }

  /** @deprecated Usar KeycloakService.getToken() directamente */
  getToken(): string | undefined {
    return this.keycloakService.getToken();
  }

  /** Retorna true si el usuario está autenticado con Keycloak */
  isLoggedIn(): boolean {
    return this.keycloakService.isLoggedIn();
  }
}
