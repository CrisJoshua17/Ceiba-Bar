import { Injectable, computed, signal } from '@angular/core';
import { CartItem, ProductsDtoTable } from '../model/Dtos';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor(private router: Router) { }



 // Signal para el estado del carrito
  readonly cartItems = signal<CartItem[]>(this.loadCartFromStorage());


  
   // Signal COMPUTED para el contador
  cartItemsCount = computed(() => 
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );

  // Signal COMPUTED para el total
  cartTotal = computed(() =>
    this.cartItems().reduce((total, item) => 
      total + (item.product.price * item.quantity), 0
    )
  );


  
   // Agregar producto al carrito
   addToCart(product: ProductsDtoTable):void{
    const currentItems = this.cartItems();
    const existingItemIndex =currentItems.findIndex(item => item.product.id === product.id);
    if(existingItemIndex > -1){
      //incrementar cantidad si ya existe
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity+=1;
      this.cartItems.set(updatedItems);
    }else{
      //agregar nuevo producto
      this.cartItems.set([...currentItems, {product, quantity: 1}]);
    }
    this.saveCartToStorage();
   }


   //remover producto del carrito 
   removeFromCart(productId: number):void{
    const updatedItems = this.cartItems().filter(item => item.product.id !== productId);
    this.cartItems.set(updatedItems);
    this.saveCartToStorage();
   }

// Actualizar cantidad
updateQuantity(productId: number, quantity: number): void {
if(quantity<=0){
  this.removeFromCart(productId);
  return;
}else{
  const updatedItems = this.cartItems().map(item => 
    item.product.id === productId ? {...item, quantity} : item
  );
  this.cartItems.set(updatedItems);
  this.saveCartToStorage();
}

}

// Obtener todos los items del carrito
  getCartItems(): CartItem[] {
    return this.cartItems();
  }



// Limpiar carrito
  clearCart(): void {
    this.cartItems.set([]);
    this.saveCartToStorage();
  }

  
  // Persistencia en localStorage
  private saveCartToStorage(): void {
    localStorage.setItem('ceiba_cart', JSON.stringify(this.cartItems()));
  }

  private loadCartFromStorage(): CartItem[] {
    try {
      const saved = localStorage.getItem('ceiba_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }


  finalizarCompra(): void {
    this.router.navigate(['/payment']);
  }

}


