"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { NavbarDriver } from '@/components/navbar-driver';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, History, Settings, Sparkles, User, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function DriverDashboardPage() {
  const router = useRouter();
  const { authenticated, user, profile, fetchProfile, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized) {
      if (!authenticated) {
        router.push('/login');
      } else if (user?.primaryRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user?.primaryRole === 'CUSTOMER') {
        router.push('/customer/dashboard');
      }
    }
  }, [initialized, authenticated, user, router]);

  useEffect(() => {
    if (authenticated && user?.primaryRole === 'DRIVER') {
      fetchProfile();
    }
  }, [authenticated, user, fetchProfile]);

  const dashboardItems = [
    {
      title: 'Entregas Activas',
      description: 'Consulta tus pedidos asignados, inicia la ruta de entrega o completa los pedidos en curso.',
      path: '/drivers/deliveries',
      icon: Truck,
      color: 'bg-ceiba-leaf/10 text-ceiba-leaf',
      buttonText: 'Ver Entregas',
    },
    {
      title: 'Historial de Rutas',
      description: 'Revisa las entregas completadas, tiempos de trayecto y el historial de tus recorridos.',
      path: '/drivers/history',
      icon: History,
      color: 'bg-ceiba-coral/10 text-ceiba-coral',
      buttonText: 'Ver Historial',
    },
    {
      title: 'Mi Perfil',
      description: 'Consulta tu calificación acumulada, comentarios de clientes e información de contacto.',
      path: '/my-profile',
      icon: Settings,
      color: 'bg-ceiba-ink/15 text-ceiba-ink',
      buttonText: 'Editar Perfil',
    },
  ];

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
        <NavbarDriver />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
          <p className="text-xs text-ceiba-ink/65">Inicializando panel repartidor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarDriver />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Welcome Block */}
        <div className="bg-white border border-ceiba-line p-8 rounded-3xl shadow-xs text-left relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ceiba-leaf/10 text-ceiba-leaf text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Portal de Reparto
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ceiba-ink">
              Hola, {profile.user.name} 🚚
            </h1>
            <p className="text-xs text-ceiba-ink/65 max-w-md leading-relaxed">
              Mantén el GPS activo, conduce con precaución y brinda la mejor experiencia de servicio Ceiba Bar.
            </p>
          </div>

          {profile.driver && (
            <div className="flex items-center gap-2 bg-ceiba-cream px-5 py-3 rounded-2xl border border-ceiba-line z-10">
              <span className="text-xs font-bold text-ceiba-ink/80">Tu Calificación:</span>
              <span className="text-base font-extrabold text-ceiba-ink flex items-center gap-1.5">
                {profile.driver.rating || 5.0}
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </span>
            </div>
          )}
        </div>

        {/* Action shortcuts */}
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
