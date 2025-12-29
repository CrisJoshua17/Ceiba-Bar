import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

constructor(
    private router: Router,
    private userService: UsersService
  ) {}

private roleRoutes = {
  'ADMIN': '/admin/dashboard',
  'CUSTOMER': '/customer/dashboard', 
  'DRIVER': '/drivers/dashboard'
};


 redirectAfterLogin(): void {
  this.userService.getCurrentUserRole().subscribe({
    next: (role: string) => {
      console.log('Rol obtenido:', role);
      if (role) {
        const route = this.roleRoutes[role.toUpperCase() as keyof typeof this.roleRoutes] || '/home';
        this.router.navigate([route]);
      } else {
        console.warn('No se encontró el rol');
        this.router.navigate(['/home']);
      }
    },
    error: (error) => {
      console.error('Error obteniendo rol:', error);
      this.router.navigate(['/home']);
    }
  });
}

  getRouteByRole(role: string): string {
    return this.roleRoutes[role as keyof typeof this.roleRoutes] || '/home';
  }
  
}
