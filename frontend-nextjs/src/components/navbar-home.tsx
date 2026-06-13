"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CartDrawer } from './cart-drawer';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  User,
  Menu,
  X,
  PhoneCall,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function Facebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Instagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function NavbarHome() {
  const pathname = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const cartItemsCount = useCartStore((state) => state.getCartItemsCount());
  const { authenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'INICIO', path: '/' },
  ];

  const menuItems = [
    { name: 'Drinks', path: '/menu/drinks' },
    { name: 'Snacks', path: '/menu/snack' },
    { name: 'Recetario', path: '/menu/recetario' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-ceiba-paper/90 backdrop-blur-md border-b border-ceiba-line shadow-xs'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-ceiba-line shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/logoarbol.jpg"
                alt="Ceiba Bar Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback si no existe el asset local en Next.js
                  (e.target as any).src = 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=80&h=80&fit=crop';
                }}
              />
            </div>
            <span className="font-bold text-lg tracking-wider text-ceiba-ink hidden sm:block">
              CEIBA BAR
            </span>
          </Link>

          {/* Links desktop */}
          <nav className="hidden lg:flex items-center gap-8 font-semibold text-sm tracking-widest text-ceiba-ink">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`transition-colors hover:text-ceiba-leaf ${
                  pathname === link.path ? 'text-ceiba-leaf' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-ceiba-leaf transition-colors cursor-pointer outline-none select-none">
                MENÚ
                <span className="text-[10px]">▼</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-ceiba-paper border border-ceiba-line text-ceiba-ink rounded-lg shadow-md p-1 min-w-40 mt-1">
                {menuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.path}
                    render={
                      <Link
                        href={item.path}
                        className="w-full flex px-3 py-2 text-xs hover:bg-ceiba-cream hover:text-ceiba-leaf rounded-md transition-all cursor-pointer font-medium"
                      />
                    }
                  >
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Botones de acción desktop */}
          <div className="hidden lg:flex items-center gap-5">
            {/* User Profile / Login */}
            {authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-10 h-10 rounded-full bg-ceiba-cream flex items-center justify-center cursor-pointer border border-ceiba-line outline-none hover:bg-ceiba-line transition-all">
                  <User className="w-5 h-5 text-ceiba-ink" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-ceiba-paper border border-ceiba-line text-ceiba-ink rounded-lg shadow-md p-1 min-w-48 mt-1">
                  <DropdownMenuItem
                    render={
                      <Link
                        href={
                          user?.primaryRole === 'ADMIN'
                            ? '/admin/dashboard'
                            : user?.primaryRole === 'DRIVER'
                            ? '/drivers/dashboard'
                            : '/customer/dashboard'
                        }
                        className="w-full flex px-3 py-2 text-xs hover:bg-ceiba-cream rounded-md transition-all font-semibold"
                      />
                    }
                  >
                    Panel de Control
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={
                      <Link
                        href="/my-profile"
                        className="w-full flex px-3 py-2 text-xs hover:bg-ceiba-cream rounded-md transition-all font-semibold"
                      />
                    }
                  >
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="w-full flex px-3 py-2 text-xs hover:bg-ceiba-coral/10 text-ceiba-coral hover:text-ceiba-coral rounded-md transition-all font-semibold cursor-pointer"
                  >
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-ceiba-cream border border-transparent hover:border-ceiba-line text-ceiba-ink transition-all"
                >
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {/* Carrito */}
            <Button
              size="icon"
              variant="ghost"
              className="relative rounded-full hover:bg-ceiba-cream border border-transparent hover:border-ceiba-line text-ceiba-ink transition-all cursor-pointer"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ceiba-coral text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </Button>

            {/* Socials */}
            <div className="flex items-center gap-3 border-l border-ceiba-line pl-5 text-ceiba-ink/75">
              <a
                href="https://www.facebook.com/share/15fkBAVpr5/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/525578951973"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-600 transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/elhombre.globo?igsh=MXN0aDRrdndsOGRi&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-600 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Botón hamburguesa móvil */}
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              size="icon"
              variant="ghost"
              className="relative rounded-full hover:bg-ceiba-cream border border-ceiba-line text-ceiba-ink"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ceiba-coral text-[8px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-ceiba-cream border border-ceiba-line text-ceiba-ink"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Menú móvil Offcanvas */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-18 left-0 w-full bg-ceiba-cream border-b border-ceiba-line shadow-lg p-5 space-y-4 animate-in slide-in-from-top duration-250">
            <div className="flex flex-col gap-3 font-semibold text-sm tracking-wider text-ceiba-ink">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-ceiba-line transition-all"
                >
                  {link.name}
                </Link>
              ))}

              <div className="px-3 py-2 text-xs font-bold text-ceiba-ink/40 tracking-widest mt-2 uppercase">
                Menú de Productos
              </div>
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-6 py-2 rounded-lg hover:bg-ceiba-line transition-all"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-ceiba-line flex items-center justify-between">
              {authenticated ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ceiba-ink text-ceiba-paper flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0] ?? 'U'}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-ceiba-ink">{user?.name}</p>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="text-ceiba-coral font-bold mt-0.5 hover:underline"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-ceiba-ink hover:text-ceiba-leaf"
                >
                  <User className="w-4 h-4" />
                  Iniciar Sesión
                </Link>
              )}

              <div className="flex items-center gap-3 text-ceiba-ink/75">
                <a
                  href="https://www.facebook.com/share/15fkBAVpr5/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/525578951973"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-600 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
                <a
                  href="https://www.instagram.com/elhombre.globo?igsh=MXN0aDRrdndsOGRi&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-600 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
