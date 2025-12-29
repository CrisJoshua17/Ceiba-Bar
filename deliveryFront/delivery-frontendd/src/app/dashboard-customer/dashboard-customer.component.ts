import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { NavbarCustomerComponent } from '../navbar-customer/navbar-customer.component';

@Component({
  selector: 'app-dashboard-customer',
  imports: [NavbarCustomerComponent, CardModule, RouterLink, ],
  templateUrl: './dashboard-customer.component.html',
  styleUrl: './dashboard-customer.component.scss'
})
export class DashboardCustomerComponent {

}
