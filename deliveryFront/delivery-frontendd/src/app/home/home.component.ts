import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  constructor(private keycloakService: KeycloakService, private router: Router) {}

  ngOnInit(): void {
    if (this.keycloakService.isLoggedIn()) {
      const role = this.keycloakService.getPrimaryRole();
      if (role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else if (role === 'DRIVER') {
        this.router.navigate(['/drivers/dashboard']);
      } else {
        this.router.navigate(['/customer/dashboard']);
      }
    } else {
      this.router.navigate(['/inicio']);
    }
  }
}
