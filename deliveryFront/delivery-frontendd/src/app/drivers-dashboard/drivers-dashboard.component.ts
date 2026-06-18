import { Component, OnInit, inject } from '@angular/core';
import { NavbarDriverComponent } from '../navbar-driver/navbar-driver.component';
import { RouterLink } from '@angular/router';
import { UsersService } from '../services/users.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drivers-dashboard',
  imports: [NavbarDriverComponent, RouterLink, CommonModule],
  templateUrl: './drivers-dashboard.component.html',
  styleUrl: './drivers-dashboard.component.scss'
})
export class DriversDashboardComponent implements OnInit {
  private usersService = inject(UsersService);
  userData = this.usersService.userData;

  ngOnInit() {
    if (!this.userData()) {
      this.usersService.getUserInfo().subscribe();
    }
  }
}
