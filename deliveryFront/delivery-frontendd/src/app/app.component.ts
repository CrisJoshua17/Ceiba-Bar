import { Component, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProgressSpinnerModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'delivery-frontendd';
  
// Inyectar el servicio
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  
 // Usar la signal directamente en el template
  loading = this.loadingService.loading;

 

   ngOnInit() {
    // Restaurar sesión si hay token
    if (this.authService.getToken()) {
      this.usersService.getUserInfo().subscribe({
        error: () => this.authService.logout() // Si el token es inválido, limpiar
      });
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
      }
    });
  }
}