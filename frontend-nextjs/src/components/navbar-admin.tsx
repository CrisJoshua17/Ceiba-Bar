"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Menu as MenuIcon,
  LogOut,
  User,
  ShoppingBag,
  Users,
  Settings,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';

export function NavbarAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { authenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
    toast.success('Sesión cerrada correctamente');
    router.push('/');
  };

  const menuItems = [
    { name: 'Usuarios', path: '/admin/users', icon: Users },
    { name: 'Productos', path: '/admin/products', icon: ShoppingBag },
    { name: 'Pedidos/Entregas', path: '/admin/orders', icon: ClipboardList },
    { name: 'Mi Perfil', path: '/my-profile', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-ceiba-paper border-b border-ceiba-line shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden rounded-full hover:bg-ceiba-cream border border-ceiba-line text-ceiba-ink cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="w-5 h-5" />
            </Button>

            <Link href="/admin/dashboard" className="flex items-center gap-3">
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
                Ceiba Bar Admin
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

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-ceiba-ink">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-ceiba-leaf font-bold">Administrador</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full hover:bg-ceiba-coral/10 hover:text-ceiba-coral text-ceiba-ink cursor-pointer"
                onClick={handleLogout}
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Left Sidebar (Sheet) for Admin Panel */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-72 bg-ceiba-cream text-ceiba-ink border-r border-ceiba-line flex flex-col p-6"
          showCloseButton={true}
        >
          <SheetHeader className="pb-4 border-b border-ceiba-line">
            <div className="flex flex-col items-center gap-3 mt-4 text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-ceiba-leaf shadow-sm bg-white">
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
                  {user?.name || 'Administrador'}
                </SheetTitle>
                <p className="text-xs text-ceiba-leaf font-bold mt-0.5">
                  Panel de Administración
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
    </>
  );
}
