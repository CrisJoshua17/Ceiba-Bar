"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { authenticated, user, login, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && authenticated) {
      if (user?.primaryRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user?.primaryRole === 'DRIVER') {
        router.push('/drivers/dashboard');
      } else {
        router.push('/customer/dashboard');
      }
    }
  }, [initialized, authenticated, user, router]);

  const handleLogin = () => {
    login(window.location.origin + '/customer/dashboard');
  };

  return (
    <div className="min-h-screen bg-ceiba-paper text-ceiba-ink flex flex-col justify-between p-6">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold hover:text-ceiba-leaf transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>
        <span className="font-extrabold tracking-widest text-sm text-ceiba-ink">CEIBA BAR</span>
      </header>

      {/* Main Form Box */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="bg-white border border-ceiba-line p-8 sm:p-12 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-ceiba-cream flex items-center justify-center text-ceiba-leaf border border-ceiba-line">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-ceiba-ink">Iniciar Sesión</h1>
            <p className="text-xs text-ceiba-ink/60 max-w-xs mx-auto leading-relaxed">
              Utilizamos Keycloak para proporcionarte un inicio de sesión seguro, rápido y confiable.
            </p>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full bg-ceiba-ink hover:bg-ceiba-ink/90 text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-lg"
          >
            <LogIn className="w-4 h-4" />
            Acceder con Keycloak
          </Button>

          <div className="pt-2 text-xs text-ceiba-ink/40">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-ceiba-leaf font-bold hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="text-center text-[10px] text-ceiba-ink/40 max-w-7xl w-full mx-auto pt-6 border-t border-ceiba-line/50">
        © {new Date().getFullYear()} Ceiba Bar. Todos los derechos reservados.
      </footer>
    </div>
  );
}
