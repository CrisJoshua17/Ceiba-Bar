import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UsersService } from '../services/users.service';
import { CartService } from '../services/cart.service';
import { BASE_PATH_IMAGES_PRODUCTS } from '../utils/enviroments/enviroment';

@Component({
  selector: 'app-navbar-customer',
  imports: [AvatarModule, BadgeModule,OverlayBadgeModule,ButtonModule,
    DrawerModule,CommonModule,RouterModule,DrawerModule,MenuModule, ProgressSpinnerModule],
  templateUrl: './navbar-customer.component.html',
  styleUrl: './navbar-customer.component.scss'
})
export class NavbarCustomerComponent {

  visible: boolean = false;

  full = computed(() => !!this.usersService.userData());

  constructor(private usersService: UsersService, private router: Router,public cartService: CartService,private cdr: ChangeDetectorRef) {}

cerrarSesion() {
    this.usersService.logout();
  this.router.navigate(['/inicio']);
  }


  // Crea un signal computado que siempre emite una nueva referencia
  cartItems = computed(() => this.cartService.getCartItems());

  

  
  



// Controlar la visibilidad del drawer
  cartDrawerVisible: boolean = false;
 
   // Métodos del carrito (ahora usan directamente el servicio)
  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
    this.cdr.markForCheck();
  }

  increaseQuantity(productId: number): void {
    const item = this.cartService.getCartItems().find(cartItem => cartItem.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
      this.cdr.markForCheck();
    }
  }

  decreaseQuantity(productId: number): void {
    const item = this.cartService.getCartItems().find(cartItem => cartItem.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
      this.cdr.markForCheck();
    } else {
      this.removeFromCart(productId);
    }
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.cdr.markForCheck();
  }

  checkout(): void {
    console.log('Proceder al checkout:', this.cartService.getCartItems());
    this.cartDrawerVisible = false;
  }

  getImageUrl(imagePath: string | null): string {
    if (!imagePath) {
      return 'https://primefaces.org/cdn/primeng/images/galleria/galleria10.jpg';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${BASE_PATH_IMAGES_PRODUCTS}${normalizedPath}`;
  }
}
