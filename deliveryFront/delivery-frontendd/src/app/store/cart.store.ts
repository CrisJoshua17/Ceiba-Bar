import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { CartItem, ProductsDtoTable } from '../model/Dtos';

export interface CartState {
  cartItems: CartItem[];
  addToCart: (product: ProductsDtoTable) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartItemsCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = createStore<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      addToCart: (product) => {
        const currentItems = get().cartItems;
        const existingItemIndex = currentItems.findIndex(
          (item) => item.product.id === product.id
        );

        if (existingItemIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += 1;
          set({ cartItems: updatedItems });
        } else {
          set({ cartItems: [...currentItems, { product, quantity: 1 }] });
        }
      },
      removeFromCart: (productId) => {
        set({
          cartItems: get().cartItems.filter((item) => item.product.id !== productId),
        });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set({
          cartItems: get().cartItems.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ cartItems: [] }),
      getCartItemsCount: () => {
        return get().cartItems.reduce((total, item) => total + item.quantity, 0);
      },
      getCartTotal: () => {
        return get().cartItems.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'ceiba_cart', // matches local storage persist key
    }
  )
);
