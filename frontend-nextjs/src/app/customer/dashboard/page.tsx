"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { NavbarCustomer } from '@/components/navbar-customer';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Clock, Settings, Sparkles, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { authenticated, user, profile, fetchProfile, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized) {
      if (!authenticated) {
        router.push('/login');
      } else if (user?.primaryRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user?.primaryRole === 'DRIVER') {
        router.push('/drivers/dashboard');
      }
    }
  }, [initialized, authenticated, user, router]);

  useEffect(() => {
    if (authenticated && user?.primaryRole === 'CUSTOMER') {
      fetchProfile();
    }
  }, [authenticated, user, fetchProfile]);

  const dashboardItems = [
    {
      title: 'Hacer un Pedido',
      description: 'Explora nuestra carta digital y pide bebidas premium, snacks y recetas directamente a tu casa.',
      path: '/menu/customer',
      icon: ShoppingBag,
      color: 'bg-ceiba-leaf/10 text-ceiba-leaf',
      buttonText: 'Explorar Menú',
    },
    {
      title: 'Mis Pedidos',
      description: 'Sigue el estado de tus entregas en tiempo real o consulta tu historial de compras.',
      path: '/customer/deliverys',
      icon: Clock,
      color: 'bg-ceiba-coral/10 text-ceiba-coral',
      buttonText: 'Ver Pedidos',
    },
    {
      title: 'Mi Perfil',
      description: 'Administra tu información de contacto, contraseña y direcciones guardadas.',
      path: '/my-profile',
      icon: Settings,
      color: 'bg-ceiba-ink/15 text-ceiba-ink',
      buttonText: 'Editar Perfil',
    },
  ];

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
        <NavbarCustomer />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
          <p className="text-xs text-ceiba-ink/65">Inicializando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarCustomer />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Welcome Block */}
        <div className="bg-white border border-ceiba-line p-8 rounded-3xl shadow-xs text-left relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ceiba-leaf/10 text-ceiba-leaf text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Bienvenido de vuelta
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ceiba-ink">
              Hola, {profile.user.name} 👋
            </h1>
            <p className="text-xs text-ceiba-ink/65 max-w-md leading-relaxed">
              ¿Listo para disfrutar de un cóctel legendario? Selecciona una opción a continuación para comenzar tu experiencia Ceiba Bar.
            </p>
          </div>

          <div className="hidden md:block w-32 h-32 opacity-15 absolute right-6 bottom-0 translate-y-4">
            <User className="w-full h-full text-ceiba-ink" />
          </div>
        </div>

        {/* Dashboard Actions Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {dashboardItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="bg-white border border-ceiba-line rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col h-full"
              >
                <CardContent className="p-8 flex flex-col justify-between flex-1 space-y-6">
                  <div className="space-y-4 text-left">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-lg text-ceiba-ink group-hover:text-ceiba-leaf transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-ceiba-ink/70 leading-relaxed min-h-[48px]">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <Link href={item.path} className="w-full">
                    <button className="w-full py-3.5 bg-ceiba-cream hover:bg-ceiba-ink hover:text-white text-ceiba-ink rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-xs">
                      {item.buttonText}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-ceiba-ink text-ceiba-paper py-10 mt-auto border-t border-ceiba-line/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-ceiba-paper/50">
          © {new Date().getFullYear()} Ceiba Bar. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
