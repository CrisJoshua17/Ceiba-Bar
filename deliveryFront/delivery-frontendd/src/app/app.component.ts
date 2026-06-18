import { Component, inject, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';
import { KeycloakService } from './services/keycloak.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProgressSpinnerModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'delivery-frontendd';
  
  // Inyectar el servicio
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private keycloakService = inject(KeycloakService);
  
  // Usar la signal directamente en el template
  loading = this.loadingService.loading;

  // Mapa de roles a rutas de dashboard
  private readonly roleRoutes: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    DRIVER: '/drivers/dashboard',
    CUSTOMER: '/customer/dashboard',
  };

  ngOnInit() {
    // Si el usuario está autenticado (acaba de hacer login o tiene sesión activa)
    if (this.keycloakService.isLoggedIn()) {
      // Cargar datos del usuario en el signal global
      this.usersService.getUserInfo().subscribe({
        error: () => this.authService.logout() // Si el token es inválido, limpiar
      });

      // Redirigir a su dashboard si está en la raíz o en /login (post-login redirect)
      const currentUrl = this.router.url;
      const isRootOrLogin = currentUrl === '/' || currentUrl === '/login' || currentUrl === '/inicio' || currentUrl.startsWith('/?');
      if (isRootOrLogin) {
        const primaryRole = this.keycloakService.getPrimaryRole();
        const redirectTo = primaryRole ? this.roleRoutes[primaryRole] : '/home';
        this.router.navigate([redirectTo]);
      }
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loadingService.show();
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loadingService.hide();
        setTimeout(() => {
          AOS.init({
            duration: 800,
            once: true,
            offset: 100
          });
          AOS.refresh();
        }, 150);
      }
    });
  }
}