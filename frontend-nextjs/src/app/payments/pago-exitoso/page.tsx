"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { useCartStore } from '@/store/useCartStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Home, List } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paypalToken = searchParams.get('token');

    if (sessionId) {
      validatePayment(sessionId, 'stripe');
    } else if (paypalToken) {
      validatePayment(paypalToken, 'paypal');
    } else {
      setLoading(false);
      setError(true);
      setMessage('No se encontró el ID de sesión de pago.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const validatePayment = async (id: string, method: 'stripe' | 'paypal') => {
    try {
      const response = await api.get(`/api/payments/validate/${method}/${id}`);
      setLoading(false);
      if (response.data?.success) {
        setSuccess(true);
        setOrderId(response.data.data);
        setMessage(response.data.message);
        clearCart();
      } else {
        setError(true);
        setMessage(response.data?.message || 'Error validando el pago.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(true);
      setMessage(
        'Error de comunicación al validar el pago. ' +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4 px-4">
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-ceiba-line rounded-3xl shadow-sm min-h-[300px]">
          <Loader2 className="w-12 h-12 text-ceiba-leaf animate-spin mb-4" />
          <h4 className="text-xl font-bold text-ceiba-ink mt-2">Confirmando tu pago...</h4>
          <p className="text-xs text-ceiba-ink/60 mt-1">Por favor no cierres esta ventana.</p>
        </div>
      )}

      {/* Success State */}
      {success && (
        <Card className="bg-white border border-ceiba-line rounded-3xl shadow-md overflow-hidden text-center">
          <CardContent className="p-8 flex flex-col items-center">
            <CheckCircle className="w-18 h-18 text-ceiba-leaf mb-4" />
            <h2 className="text-3xl font-extrabold text-ceiba-leaf-dark m-0">¡Pago Exitoso!</h2>
            <p className="text-xs text-ceiba-ink/75 mt-2">Tu orden ha sido confirmada correctamente.</p>

            <div className="my-6 px-5 py-2.5 bg-ceiba-cream border border-ceiba-line rounded-xl inline-flex items-center gap-2">
              <span className="text-xs font-bold text-ceiba-ink">Orden ID:</span>
              <span className="text-xs font-extrabold text-ceiba-leaf-dark">{orderId}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-4">
              <Link href="/customer/dashboard">
                <Button
                  variant="outline"
                  className="w-full border-ceiba-line text-ceiba-ink hover:bg-ceiba-cream font-bold py-5 flex items-center gap-2 rounded-xl"
                >
                  <Home className="w-4 h-4" />
                  Inicio
                </Button>
              </Link>
              <Link href="/customer/deliverys">
                <Button className="w-full bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold py-5 flex items-center gap-2 rounded-xl">
                  <List className="w-4 h-4" />
                  Mis Pedidos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-white border border-ceiba-line rounded-3xl shadow-md overflow-hidden text-center">
          <CardContent className="p-8 flex flex-col items-center">
            <XCircle className="w-18 h-18 text-ceiba-coral mb-4" />
            <h2 className="text-3xl font-extrabold text-ceiba-coral m-0">Error en el Pago</h2>
            <p className="text-xs text-ceiba-ink/80 mt-2">{message}</p>

            <div className="my-6 px-6 py-4 bg-orange-50/50 border border-orange-200/60 rounded-xl text-left text-xs text-orange-850 leading-relaxed max-w-md">
              Si crees que esto es un error, por favor contacta a soporte o intenta nuevamente.
            </div>

            <div className="w-full max-w-xs mt-2">
              <Link href="/menu/customer">
                <Button className="w-full bg-ceiba-ink hover:bg-ceiba-ink/90 text-white font-bold py-5 flex items-center gap-2 rounded-xl">
                  Volver al Menú
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <div className="containerBase w-full py-12 px-4 flex flex-col items-center justify-center min-h-screen bg-ceiba-paper">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-8 bg-white border border-ceiba-line rounded-3xl shadow-sm min-h-[300px]">
            <Loader2 className="w-12 h-12 text-ceiba-leaf animate-spin mb-4" />
            <h4 className="text-xl font-bold text-ceiba-ink mt-2">Cargando verificación...</h4>
          </div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
