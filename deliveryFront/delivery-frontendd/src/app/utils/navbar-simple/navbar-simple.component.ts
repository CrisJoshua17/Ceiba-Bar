import { Component } from '@angular/core';
import {  AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-navbar-simple',
  imports: [ AvatarModule, BadgeModule,OverlayBadgeModule,ButtonModule,DrawerModule,CommonModule,RouterModule],
  templateUrl: './navbar-simple.component.html',
  styleUrl: './navbar-simple.component.scss'
})
export class NavbarSimpleComponent {

}
