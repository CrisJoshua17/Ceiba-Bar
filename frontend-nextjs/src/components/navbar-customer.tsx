"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CartDrawer } from './cart-drawer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ShoppingCart,
  Menu as MenuIcon,
  LogOut,
  User,
  ShoppingBag,
  Clock,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

export function NavbarCustomer() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cartItemsCount = useCartStore((state) => state.getCartItemsCount());
  const { authenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
    toast.success('Sesión cerrada correctamente');
    router.push('/');
  };

  const menuItems = [
    { name: 'Menú Cliente', path: '/menu/customer', icon: ShoppingBag },
    { name: 'Mis Pedidos', path: '/customer/deliverys', icon: Clock },
    { name: 'Mi Perfil', path: '/my-profile', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-ceiba-paper border-b border-ceiba-line shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Back button if not dashboard */}
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden rounded-full hover:bg-ceiba-cream border border-ceiba-line text-ceiba-ink cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="w-5 h-5" />
            </Button>

            <Link href="/customer/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-ceiba-line shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logoarbol.jpg"
                  alt="Ceiba Bar Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=80&h=80&fit=crop';
                  }}
                />
              </div>
              <span className="font-bold text-base tracking-wider text-ceiba-ink hidden sm:block">
                Ceiba Bar Cliente
              </span>
            </Link>
          </div>

          {/* Desktop horizontal navigation */}
          <nav className="hidden lg:flex items-center gap-8 font-semibold text-sm tracking-wider text-ceiba-ink">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 transition-colors hover:text-ceiba-leaf ${
                    pathname === item.path ? 'text-ceiba-leaf' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right actions (Cart and Logout / User Details) */}
          <div className="flex items-center gap-4">
            {/* Desktop User Info & Logout */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-ceiba-ink">{user?.name || 'Cliente'}</p>
                <p className="text-[10px] text-ceiba-ink/60">{user?.email}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full hover:bg-ceiba-coral/10 hover:text-ceiba-coral text-ceiba-ink border border-transparent hover:border-ceiba-coral/20 cursor-pointer"
                onClick={handleLogout}
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Cart Button */}
            <Button
              size="icon"
              variant="ghost"
              className="relative rounded-full hover:bg-ceiba-cream border border-ceiba-line text-ceiba-ink cursor-pointer"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ceiba-coral text-[8px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Left Sidebar (Sheet) for Customer Panel */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-72 bg-ceiba-cream text-ceiba-ink border-r border-ceiba-line flex flex-col p-6"
          showCloseButton={true}
        >
          <SheetHeader className="pb-4 border-b border-ceiba-line">
            <div className="flex flex-col items-center gap-3 mt-4 text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-ceiba-leaf shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/logoarbol.jpg"
                  alt="Ceiba Bar Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=80&h=80&fit=crop';
                  }}
                />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-ceiba-ink">
                  {user?.name || 'Cliente'}
                </SheetTitle>
                <p className="text-xs text-ceiba-ink/60 mt-0.5 truncate max-w-[200px]">
                  {user?.email}
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Navigation Links */}
          <div className="flex-1 py-6 space-y-2">
            {authenticated && menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-ceiba-ink text-ceiba-paper'
                      : 'hover:bg-ceiba-line/50 text-ceiba-ink'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-ceiba-leaf' : 'text-ceiba-ink/75'}`} />
                  {item.name}
                </Link>
              );
            })}

            {!authenticated && (
              <Link
                href="/login"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide hover:bg-ceiba-line/50 text-ceiba-ink"
              >
                <User className="w-5 h-5 text-ceiba-ink/75" />
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Footer with logout */}
          {authenticated && (
            <div className="pt-4 border-t border-ceiba-line mt-auto">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-ceiba-coral text-ceiba-coral hover:bg-ceiba-coral hover:text-white rounded-xl py-5 font-bold transition-all"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
