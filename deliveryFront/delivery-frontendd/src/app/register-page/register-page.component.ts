import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarSimpleComponent } from '../utils/navbar-simple/navbar-simple.component';
import { KeycloakService } from '../services/keycloak.service';

/**
 * RegisterPageComponent
 *
 * Ya no gestiona formulario de registro propio.
 * Redirige al formulario de registro nativo de Keycloak.
 * Keycloak valida los datos, crea el usuario y redirige de vuelta.
 *
 * En producción, el realm ceiba-bar tendrá un tema personalizado
 * con la identidad visual de Ceiba Bar.
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    RouterModule,
    NavbarSimpleComponent,
  ],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {

  loading = false;

  constructor(private keycloakService: KeycloakService) {}

  /**
   * Redirige al formulario de registro de Keycloak.
   * Tras el registro, Keycloak redirige al home de la app.
   */
  register(): void {
    this.loading = true;
    this.keycloakService.register(`${window.location.origin}/home`);
  }

  /** Alternativa: ir al login si ya tiene cuenta */
  goToLogin(): void {
    this.keycloakService.login();
  }
}