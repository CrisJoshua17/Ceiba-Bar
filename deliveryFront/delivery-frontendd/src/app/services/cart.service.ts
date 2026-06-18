import { Injectable, inject } from '@angular/core';
import { CartItem, ProductsDtoTable } from '../model/Dtos';
import { CartStoreService } from './cart-store.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartStore = inject(CartStoreService);

  readonly cartItems = this.cartStore.cartItems;
  readonly cartItemsCount = this.cartStore.cartItemsCount;
  readonly cartTotal = this.cartStore.cartTotal;

  addToCart(product: ProductsDtoTable): void {
    this.cartStore.addToCart(product);
  }

  removeFromCart(productId: number): void {
    this.cartStore.removeFromCart(productId);
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartStore.updateQuantity(productId, quantity);
  }

  getCartItems(): CartItem[] {
    return this.cartStore.getCartItems();
  }

  clearCart(): void {
    this.cartStore.clearCart();
  }

  finalizarCompra(): void {
    this.cartStore.finalizarCompra();
  }
}


