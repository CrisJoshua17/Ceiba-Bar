import { Component, effect } from '@angular/core';
import {  AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Subscription } from 'rxjs';
import { UsersService } from '../services/users.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoadingService } from '../services/loading.service';
import { BASE_PATH_IMAGES } from '../utils/enviroments/enviroment';
import { UserInfo } from '../model/Dtos';


@Component({
  selector: 'app-navbar-admin',
  imports: [AvatarModule, BadgeModule,OverlayBadgeModule,ButtonModule,
    DrawerModule,CommonModule,RouterModule,DrawerModule,MenuModule, ProgressSpinnerModule],
  templateUrl: './navbar-admin.component.html',
  styleUrl: './navbar-admin.component.scss'
})
export class NavbarAdminComponent {
  visible: boolean = false;
 

  user: UserInfo | null = null;                   
  userImage: string = '';           
  userName: string = 'Usuario';      
 

  constructor(
    private usersService: UsersService,
    private router: Router,
    
  ) {
    effect(() => {
      const data = this.usersService.userData();
      if (data && data.user) {
        this.user = data.user;
      }
    });
  }
  

  ngOnInit(): void {
   

    // Opcional: forzar carga si aún no hay datos (por si entras directo a una ruta)
    if (!this.usersService.userData()) {
      this.usersService.getUserInfo().subscribe();
    }
  }

  // Helper para construir la URL de la imagen
  getUserImageUrl(imagePath: string | null | undefined): string {
    const defaultImage = 'https://primefaces.org/cdn/primeng/images/galleria/galleria10.jpg';
    
    if (!imagePath) return defaultImage;
    if (imagePath.startsWith('http')) return imagePath;

    const base = BASE_PATH_IMAGES;
    const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${base}${normalized}`;
  }

  goToProfile() {
    console.log(this.user)
    this.router.navigate(['/my-profile']);
  }

  ngOnDestroy(): void {
    // this.userSub?.unsubscribe(); // Ya no es necesario con signals
  }

 // Métodos para los eventos click
  goToUsuarios() {
   this.router.navigate(['admin/users']);
  }

  goToProductos() {
    console.log('Navegando a Productos');
    this.router.navigate(['/admin/products']);
  }

  goToEntregas() {
    console.log('Navegando a Entregas');
    this.visible = false;
    // this.router.navigate(['/entregas']);
  }



  cerrarSesion() {
    this.usersService.logout();
  this.router.navigate(['/inicio']);
  }

}
