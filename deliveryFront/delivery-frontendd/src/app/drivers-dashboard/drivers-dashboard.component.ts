import { Component } from '@angular/core';
import { NavbarDriverComponent } from '../navbar-driver/navbar-driver.component';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-drivers-dashboard',
  imports: [NavbarDriverComponent, CardModule, RouterLink],
  templateUrl: './drivers-dashboard.component.html',
  styleUrl: './drivers-dashboard.component.scss'
})
export class DriversDashboardComponent {

}
