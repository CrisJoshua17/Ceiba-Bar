import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UsersService } from '../services/users.service';
import { UserInfo } from '../model/Dtos';

@Component({
  selector: 'app-navbar-driver',
  imports: [AvatarModule, BadgeModule,OverlayBadgeModule,ButtonModule,
    DrawerModule,CommonModule,RouterModule,DrawerModule,MenuModule, ProgressSpinnerModule],
  templateUrl: './navbar-driver.component.html',
  styleUrl: './navbar-driver.component.scss'
})
export class NavbarDriverComponent {
 visible: boolean = false;
   user: UserInfo | null = null;     
 
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
 

  cerrarSesion() {
    this.usersService.logout();
  this.router.navigate(['/inicio']);
  }
}
