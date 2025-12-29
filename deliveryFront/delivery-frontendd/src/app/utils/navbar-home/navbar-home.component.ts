import { ChangeDetectorRef, Component, computed } from '@angular/core';
import {  AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../model/Dtos';
import { DataViewModule } from 'primeng/dataview';
import { PaginatorModule } from 'primeng/paginator';
import { BASE_PATH_IMAGES_PRODUCTS } from '../../utils/enviroments/enviroment';


@Component({
  selector: 'app-navbar-home',
  imports: [ AvatarModule, BadgeModule,OverlayBadgeModule,ButtonModule,DrawerModule,CommonModule,RouterModule,DataViewModule
    ,PaginatorModule
  ],
  templateUrl: './navbar-home.component.html',
  styleUrl: './navbar-home.component.scss'
})
export class NavbarHomeComponent {

  constructor(public cartService: CartService ,private cdr: ChangeDetectorRef){}

  
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