import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';

/**
 * Servicio de autenticación con Keycloak.
 *
 * Encapsula la instancia de keycloak-js y expone
 * los métodos necesarios para login, logout, token y roles.
 *
 * Se inicializa como APP_INITIALIZER en app.config.ts
 * antes de que Angular renderice la aplicación.
 */
@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  private keycloak: Keycloak;

  constructor() {
    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });
  }

  /**
   * Inicializa Keycloak con SSO silencioso.
   * Debe ser llamado como APP_INITIALIZER antes de que
   * arranque la aplicación Angular.
   */
  async init(): Promise<boolean> {
    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false,
      });
      return authenticated;
    } catch (error) {
      console.error('[Keycloak] Error al inicializar:', error);
      return false;
    }
  }

  /** Redirige al formulario de login de Keycloak */
  login(redirectUri?: string): void {
    this.keycloak.login({ redirectUri: redirectUri ?? window.location.origin });
  }

  /** Redirige al formulario de registro de Keycloak */
  register(redirectUri?: string): void {
    this.keycloak.register({ redirectUri: redirectUri ?? window.location.origin });
  }

  /** Cierra la sesión en Keycloak y redirige al inicio */
  logout(redirectUri?: string): void {
    this.keycloak.logout({ redirectUri: redirectUri ?? window.location.origin });
  }

  /** Retorna el token JWT de acceso actual */
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  /** Retorna true si el usuario está autenticado */
  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  /** Retorna el nombre de usuario (preferred_username del token) */
  getUsername(): string | undefined {
    return this.keycloak.tokenParsed?.['preferred_username'];
  }

  /** Retorna el email del usuario desde los claims del token */
  getEmail(): string | undefined {
    return this.keycloak.tokenParsed?.['email'];
  }

  /** Retorna el nombre completo del usuario */
  getFullName(): string | undefined {
    return this.keycloak.tokenParsed?.['name'];
  }

  /** Retorna los roles de realm del usuario */
  getRoles(): string[] {
    const realmAccess = this.keycloak.tokenParsed?.['realm_access'] as { roles?: string[] } | undefined;
    return realmAccess?.roles ?? [];
  }

  /** Verifica si el usuario tiene un rol específico */
  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  /** Retorna el rol principal del usuario (ADMIN > DRIVER > CUSTOMER) */
  getPrimaryRole(): string | undefined {
    const roles = this.getRoles();
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('DRIVER')) return 'DRIVER';
    if (roles.includes('CUSTOMER')) return 'CUSTOMER';
    return undefined;
  }

  /** Retorna el subject (UUID) del usuario en Keycloak */
  getUserId(): string | undefined {
    return this.keycloak.tokenParsed?.sub;
  }

  /**
   * Refresca el token si está próximo a expirar.
   * Útil para llamadas HTTP de larga duración.
   */
  async refreshToken(minValidity = 30): Promise<boolean> {
    try {
      return await this.keycloak.updateToken(minValidity);
    } catch {
      console.warn('[Keycloak] No se pudo refrescar el token. Redirigiendo a login...');
      this.login();
      return false;
    }
  }
}
