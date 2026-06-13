"use client";

import React, { use } from 'react';
import dynamic from 'next/dynamic';
import { NavbarCustomer } from '@/components/navbar-customer';
import { NavbarAdmin } from '@/components/navbar-admin';
import { NavbarDriver } from '@/components/navbar-driver';
import { NavbarHome } from '@/components/navbar-home';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';

// Dynamically load the Leaflet tracking component to prevent SSR "window is not defined" issues
const MapTracking = dynamic(() => import('@/components/map-tracking'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 bg-white border border-ceiba-line rounded-3xl p-6 shadow-md">
      <Loader2 className="w-10 h-10 text-ceiba-leaf animate-spin" />
      <p className="text-xs text-ceiba-ink/65">Cargando mapa interactivo...</p>
    </div>
  ),
});

export default function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = parseInt(resolvedParams.id, 10);
  const { profile } = useAuthStore();

  const renderNavbar = () => {
    if (!profile?.user?.role) return <NavbarHome />;
    switch (profile.user.role) {
      case 'ADMIN':
        return <NavbarAdmin />;
      case 'DRIVER':
        return <NavbarDriver />;
      case 'CUSTOMER':
        return <NavbarCustomer />;
      default:
        return <NavbarHome />;
    }
  };

  const getBackLink = () => {
    if (!profile?.user?.role) return '/';
    switch (profile.user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'DRIVER':
        return '/drivers/dashboard';
      default:
        return '/customer/deliverys';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      {renderNavbar()}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex flex-col">
        <div className="text-left space-y-2 border-b border-ceiba-line pb-6">
          <Link
            href={getBackLink()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ceiba-leaf hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Panel
          </Link>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <MapPin className="w-8 h-8 text-ceiba-leaf" />
            Monitoreo en Tiempo Real
          </h1>
          <p className="text-xs text-ceiba-ink/60">
            Sigue el trayecto de tu pedido y visualiza la ubicación del repartidor en el mapa.
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-stretch">
          {isNaN(orderId) ? (
            <Card className="bg-white border border-ceiba-line rounded-3xl p-8 text-center">
              <CardContent className="space-y-4">
                <p className="text-base font-bold text-ceiba-coral">ID de Orden Inválido</p>
                <Link href={getBackLink()}>
                  <Button className="bg-ceiba-ink hover:bg-ceiba-ink/90 text-white rounded-xl">
                    Regresar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <MapTracking orderId={orderId} />
          )}
        </div>
      </main>

      <footer className="bg-ceiba-ink text-ceiba-paper py-10 mt-auto border-t border-ceiba-line/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-ceiba-paper/50">
          © {new Date().getFullYear()} Ceiba Bar. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
