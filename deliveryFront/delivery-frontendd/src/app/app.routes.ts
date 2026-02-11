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

export const routes: Routes = [
    { path: 'map/:id', component: TrackingComponent },
     { path: 'home', component: HomeComponent },
     { path: 'inicio', component: FirstViewComponent },
     { path: '', component: FirstViewComponent },
     {path: 'login', component: LoginPageComponent},
     {path:'registro', component:RegisterPageComponent},
     {path:'admin/dashboard', component:AdminDashboardComponent},
     {path:'customer/dashboard', component:DashboardCustomerComponent},
     {path:'customer/deliverys', component:CustomerDeliveryComponent},
      {path:'drivers/dashboard', component:DriversDashboardComponent},
      {path:'drivers/deliveries', component:DriversDeliveriesComponent},
      {path:'drivers/history', component:DriversHistoryComponent},
     {path:'my-profile', component:ProfileComponent},
     {path:'admin/users', component:AdminUsersComponent},
     {path:'admin/products', component:AdminProductsComponent},
      {path:'menu/drinks', component:MenuDrinksComponent},
      {path:'menu/snack', component:MenuSnackComponent},
      {path:'menu/recetario', component:MenuRecetarioComponent},
      {path:'menu/customer', component:CustomerMenuComponent},
       {path:'payment', component:PaymentComponent},
       {path: 'payments/pago-exitoso', component: PaymentSuccessComponent},
       {path: 'payments/pago-cancelado', component: PaymentCancelComponent},
       {path:'admin/orders', component:PedidosAdminComponent},

       
];
