import { Component, OnInit, inject, signal } from '@angular/core';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { RouterLink } from "@angular/router";
import { UsersService } from '../services/users.service';
import { ProductsService } from '../services/products.service';
import { OrdersService } from '../services/orders.service';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  imports: [NavbarAdminComponent, RouterLink, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private usersService = inject(UsersService);
  private productsService = inject(ProductsService);
  private ordersService = inject(OrdersService);

  userData = this.usersService.userData;
  usersCount = signal(0);
  productsCount = signal(0);
  ordersCount = signal(0);
  loadingStats = signal(false);

  ngOnInit() {
    if (!this.userData()) {
      this.usersService.getUserInfo().subscribe();
    }
    this.loadStats();
  }

  loadStats() {
    this.loadingStats.set(true);
    forkJoin({
      users: this.usersService.getAllUsers(),
      products: this.productsService.findAllProducts(),
      orders: this.ordersService.findAllOrders()
    }).subscribe({
      next: (resp) => {
        this.usersCount.set(resp.users.data?.length || 0);
        this.productsCount.set(resp.products.data?.length || 0);
        this.ordersCount.set(resp.orders.data?.length || 0);
        this.loadingStats.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.loadingStats.set(false);
      }
    });
  }
}
