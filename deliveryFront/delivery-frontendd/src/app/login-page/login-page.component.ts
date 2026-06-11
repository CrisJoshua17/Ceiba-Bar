import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarSimpleComponent } from '../utils/navbar-simple/navbar-simple.component';
import { KeycloakService } from '../services/keycloak.service';

/**
 * LoginPageComponent
 *
 * Ya no gestiona formulario de usuario/contraseña.
 * Redirige al usuario al flujo de login de Keycloak
 * haciendo clic en el botón "Iniciar Sesión".
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ButtonModule,
    ProgressSpinnerModule,
    CardModule,
    CommonModule,
    RouterModule,
    NavbarSimpleComponent,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {

  loading = false;

  constructor(private keycloakService: KeycloakService) {}

  /**
   * Redirige al login de Keycloak.
   * Keycloak gestiona el formulario de usuario y contraseña.
   * Tras el login exitoso, Keycloak redirige de vuelta a la app.
   */
  login(): void {
    this.loading = true;
    this.keycloakService.login();
  }
}
