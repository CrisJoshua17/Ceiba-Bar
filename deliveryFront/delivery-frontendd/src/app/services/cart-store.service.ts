import { Injectable, computed, signal } from '@angular/core';
import { CartItem, ProductsDtoTable } from '../model/Dtos';
import { Router } from '@angular/router';
import { useCartStore } from '../store/cart.store';

@Injectable({
  providedIn: 'root'
})
export class CartStoreService {
  // Signal representation of the Zustand store state
  private readonly _cartItems = signal<CartItem[]>(useCartStore.getState().cartItems);

  constructor(private router: Router) {
    // Subscribe to Zustand store changes and sync them with our Angular Signal
    useCartStore.subscribe((state) => {
      this._cartItems.set(state.cartItems);
    });
  }

  // Read-only signal exposed to components
  readonly cartItems = this._cartItems.asReadonly();

  // Computed signals for total and count
  readonly cartItemsCount = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );

  readonly cartTotal = computed(() =>
    this.cartItems().reduce((total, item) => total + item.product.price * item.quantity, 0)
  );

  addToCart(product: ProductsDtoTable): void {
    useCartStore.getState().addToCart(product);
  }

  removeFromCart(productId: number): void {
    useCartStore.getState().removeFromCart(productId);
  }

  updateQuantity(productId: number, quantity: number): void {
    useCartStore.getState().updateQuantity(productId, quantity);
  }

  getCartItems(): CartItem[] {
    return useCartStore.getState().cartItems;
  }

  clearCart(): void {
    useCartStore.getState().clearCart();
  }

  finalizarCompra(): void {
    this.router.navigate(['/payment']);
  }
}
