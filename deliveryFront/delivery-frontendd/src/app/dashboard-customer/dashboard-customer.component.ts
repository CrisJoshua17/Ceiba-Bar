import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarCustomerComponent } from '../navbar-customer/navbar-customer.component';
import { UsersService } from '../services/users.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-customer',
  imports: [NavbarCustomerComponent, RouterLink, CommonModule],
  templateUrl: './dashboard-customer.component.html',
  styleUrl: './dashboard-customer.component.scss'
})
export class DashboardCustomerComponent implements OnInit {
  private usersService = inject(UsersService);
  userData = this.usersService.userData;

  ngOnInit() {
    if (!this.userData()) {
      this.usersService.getUserInfo().subscribe();
    }
  }
}
