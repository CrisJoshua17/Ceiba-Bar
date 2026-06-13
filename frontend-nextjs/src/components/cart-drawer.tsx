"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { getProductImageUrl } from '@/lib/image-utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
  } = useCartStore();

  const handleDecrease = (productId: number, currentQty: number) => {
    if (currentQty <= 1) {
      removeFromCart(productId);
      toast.info('Producto eliminado del carrito');
    } else {
      updateQuantity(productId, currentQty - 1);
    }
  };

  const handleIncrease = (productId: number, currentQty: number) => {
    updateQuantity(productId, currentQty + 1);
  };

  const handleCheckout = () => {
    onOpenChange(false);
    router.push('/payment');
  };

  const handleClear = () => {
    clearCart();
    toast.info('Carrito vaciado');
  };

  const total = getCartTotal();
  const count = getCartItemsCount();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-ceiba-cream text-ceiba-ink border-l border-ceiba-line flex flex-col p-6">
        <SheetHeader className="pb-4 border-b border-ceiba-line">
          <div className="flex items-center justify-between mt-2">
            <SheetTitle className="text-xl font-bold flex items-center gap-2 text-ceiba-ink">
              <ShoppingCart className="w-5 h-5 text-ceiba-leaf" />
              Tu Carrito
            </SheetTitle>
            <span className="text-xs bg-ceiba-ink text-ceiba-paper px-2.5 py-1 rounded-full font-medium">
              {count} items
            </span>
          </div>
        </SheetHeader>

        {/* Contenido del carrito */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-ceiba-line flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-ceiba-ink/40" />
              </div>
              <div>
                <p className="text-base font-medium text-ceiba-ink">Tu carrito está vacío</p>
                <p className="text-sm text-ceiba-ink/60 mt-1">¡Agrega bebidas y snacks deliciosos!</p>
              </div>
              <Button
                variant="outline"
                className="mt-2 border-ceiba-ink text-ceiba-ink hover:bg-ceiba-ink hover:text-ceiba-paper transition-all"
                onClick={() => onOpenChange(false)}
              >
                Seguir Comprando
              </Button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-4 bg-ceiba-paper p-3 rounded-xl shadow-xs border border-ceiba-line transition-all hover:shadow-md"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-ceiba-line flex-shrink-0 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductImageUrl(item.product.image)}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate text-ceiba-ink">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-ceiba-leaf font-bold mt-0.5">
                    ${item.product.price.toFixed(2)} MXN
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center border border-ceiba-line rounded-lg overflow-hidden bg-ceiba-cream">
                    <button
                      onClick={() => handleDecrease(item.product.id, item.quantity)}
                      className="px-2 py-1 text-ceiba-ink hover:bg-ceiba-line transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 text-xs font-bold min-w-6 text-center text-ceiba-ink">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrease(item.product.id, item.quantity)}
                      className="px-2 py-1 text-ceiba-ink hover:bg-ceiba-line transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      removeFromCart(item.product.id);
                      toast.info('Producto eliminado del carrito');
                    }}
                    className="text-ceiba-coral hover:text-red-700 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="pt-4 border-t border-ceiba-line flex flex-col gap-3 mt-auto">
            <div className="flex items-center justify-between text-base">
              <span className="font-bold text-ceiba-ink">Total Estimado</span>
              <span className="font-extrabold text-ceiba-leaf text-lg">
                ${total.toFixed(2)} MXN
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="outline"
                className="w-full border-ceiba-coral text-ceiba-coral hover:bg-ceiba-coral hover:text-white transition-all rounded-xl py-5"
                onClick={handleClear}
              >
                Vaciar
              </Button>
              <Button
                className="w-full bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold transition-all rounded-xl py-5 shadow-xs hover:shadow-lg"
                onClick={handleCheckout}
              >
                Checkout
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
