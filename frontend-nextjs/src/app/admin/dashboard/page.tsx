"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/axios';
import { NavbarAdmin } from '@/components/navbar-admin';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ShoppingBag, ClipboardList, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { authenticated, user, profile, fetchProfile, initialized } = useAuthStore();

  const [stats, setStats] = useState({
    usersCount: 0,
    productsCount: 0,
    ordersCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (initialized) {
      if (!authenticated) {
        router.push('/login');
      } else if (user?.primaryRole === 'CUSTOMER') {
        router.push('/customer/dashboard');
      } else if (user?.primaryRole === 'DRIVER') {
        router.push('/drivers/dashboard');
      }
    }
  }, [initialized, authenticated, user, router]);

  useEffect(() => {
    if (authenticated && user?.primaryRole === 'ADMIN') {
      fetchProfile();
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      // Intentamos cargar la info de las 3 entidades principales para calcular totales
      const [usersResp, productsResp, ordersResp] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/products/all'),
        api.get('/api/orders/all'),
      ]);

      setStats({
        usersCount: usersResp.data?.data?.length || 0,
        productsCount: productsResp.data?.data?.length || 0,
        ordersCount: ordersResp.data?.data?.length || 0,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const menuItems = [
    {
      title: 'Gestionar Usuarios',
      description: 'Consulta, edita o elimina usuarios registrados, asigna roles de repartidores y administradores.',
      path: '/admin/users',
      icon: Users,
      count: stats.usersCount,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: 'Gestionar Productos',
      description: 'Agrega nuevos cócteles, botanas o recetarios. Sube fotos de productos y ajusta precios y disponibilidad.',
      path: '/admin/products',
      icon: ShoppingBag,
      count: stats.productsCount,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      title: 'Pedidos & Entregas',
      description: 'Visualiza órdenes de clientes, monitorea su estatus y asigna manualmente repartidores disponibles.',
      path: '/admin/orders',
      icon: ClipboardList,
      count: stats.ordersCount,
      color: 'bg-amber-500/10 text-amber-600',
    },
  ];

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
        <NavbarAdmin />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
          <p className="text-xs text-ceiba-ink/65">Cargando panel administrador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarAdmin />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Welcome Block */}
        <div className="bg-white border border-ceiba-line p-8 rounded-3xl shadow-xs text-left relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ceiba-leaf/10 text-ceiba-leaf text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Administración Central
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ceiba-ink">
              Panel de Control Admin
            </h1>
            <p className="text-xs text-ceiba-ink/65 max-w-md leading-relaxed">
              Monitorea de forma centralizada a los usuarios del sistema, la disponibilidad del menú digital y el flujo de repartidores en CDMX.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-ceiba-cream px-5 py-3 rounded-2xl border border-ceiba-line z-10">
            <div className="p-2 bg-ceiba-leaf/10 rounded-xl text-ceiba-leaf">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs">Monitoreo Activo</h4>
              <p className="text-[10px] text-ceiba-ink/60">Todo en tiempo real</p>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="bg-white border border-ceiba-line rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col h-full"
              >
                <CardContent className="p-8 flex flex-col justify-between flex-1 space-y-6">
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {loadingStats ? (
                        <div className="h-5 w-8 bg-ceiba-cream animate-pulse rounded-lg" />
                      ) : (
                        <span className="text-2xl font-black text-ceiba-ink/35 group-hover:text-ceiba-leaf/80 transition-colors">
                          {item.count}
                        </span>
                      )}
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
                      Gestionar
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
