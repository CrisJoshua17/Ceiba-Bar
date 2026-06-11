import { Routes } from '@angular/router';
import { TrackingComponent } from './tracking/tracking.component';
import { HomeComponent } from './home/home.component';
import { FirstViewComponent } from './first-view/first-view.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { RegisterPageComponent } from './register-page/register-page.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminProductsComponent } from './admin-products/admin-products.component';
import { MenuDrinksComponent } from './menus/menu-drinks/menu-drinks.component';
import { MenuSnackComponent } from './menus/menu-snack/menu-snack.component';
import { MenuRecetarioComponent } from './menus/menu-recetario/menu-recetario.component';
import { DashboardCustomerComponent } from './dashboard-customer/dashboard-customer.component';
import { CustomerMenuComponent } from './customer-menu/customer-menu.component';
import { DriversDashboardComponent } from './drivers-dashboard/drivers-dashboard.component';
import { PaymentComponent } from './payment/payment.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentCancelComponent } from './payment-cancel/payment-cancel.component';
import { PedidosAdminComponent } from './pedidos-admin/pedidos-admin.component';
import { DriversDeliveriesComponent } from './drivers-deliveries/drivers-deliveries.component';
import { DriversHistoryComponent } from './drivers-history/drivers-history.component';
import { CustomerDeliveryComponent } from './customer-delivery/customer-delivery.component';

import { authGuard } from './utils/guards/auth.guard';
import { roleGuard } from './utils/guards/role.guard';

export const routes: Routes = [
  // ── Rutas públicas ──────────────────────────────────────────────
  { path: '', component: FirstViewComponent },
  { path: 'inicio', component: FirstViewComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'registro', component: RegisterPageComponent },
  { path: 'home', component: HomeComponent },

  // Menús públicos (catálogo visible sin login)
  { path: 'menu/drinks', component: MenuDrinksComponent },
  { path: 'menu/snack', component: MenuSnackComponent },
  { path: 'menu/recetario', component: MenuRecetarioComponent },

  // Páginas de resultado de pago (acceso tras redirect de Stripe/PayPal)
  { path: 'payments/pago-exitoso', component: PaymentSuccessComponent },
  { path: 'payments/pago-cancelado', component: PaymentCancelComponent },

  // ── Rutas autenticadas (cualquier rol) ───────────────────────────
  {
    path: 'my-profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'payment',
    component: PaymentComponent,
    canActivate: [authGuard]
  },

  // ── Rutas de Customer ────────────────────────────────────────────
  {
    path: 'menu/customer',
    component: CustomerMenuComponent,
    canActivate: [roleGuard('CUSTOMER', 'ADMIN')]
  },
  {
    path: 'customer/dashboard',
    component: DashboardCustomerComponent,
    canActivate: [roleGuard('CUSTOMER', 'ADMIN')]
  },
  {
    path: 'customer/deliverys',
    component: CustomerDeliveryComponent,
    canActivate: [roleGuard('CUSTOMER', 'ADMIN')]
  },
  {
    path: 'map/:id',
    component: TrackingComponent,
    canActivate: [authGuard]
  },

  // ── Rutas de Driver ──────────────────────────────────────────────
  {
    path: 'drivers/dashboard',
    component: DriversDashboardComponent,
    canActivate: [roleGuard('DRIVER', 'ADMIN')]
  },
  {
    path: 'drivers/deliveries',
    component: DriversDeliveriesComponent,
    canActivate: [roleGuard('DRIVER', 'ADMIN')]
  },
  {
    path: 'drivers/history',
    component: DriversHistoryComponent,
    canActivate: [roleGuard('DRIVER', 'ADMIN')]
  },

  // ── Rutas de Admin ───────────────────────────────────────────────
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [roleGuard('ADMIN')]
  },
  {
    path: 'admin/users',
    component: AdminUsersComponent,
    canActivate: [roleGuard('ADMIN')]
  },
  {
    path: 'admin/products',
    component: AdminProductsComponent,
    canActivate: [roleGuard('ADMIN')]
  },
  {
    path: 'admin/orders',
    component: PedidosAdminComponent,
    canActivate: [roleGuard('ADMIN')]
  },
];
