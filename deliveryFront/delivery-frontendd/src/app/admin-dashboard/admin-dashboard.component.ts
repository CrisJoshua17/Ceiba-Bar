import { Component } from '@angular/core';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { CardModule } from 'primeng/card';
import { RouterLink } from "@angular/router";


@Component({
  selector: 'app-admin-dashboard',
  imports: [NavbarAdminComponent, CardModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {

  

}
