"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function PagoCanceladoPage() {
  return (
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center min-h-screen bg-ceiba-paper text-ceiba-ink">
      <div className="w-full max-w-xl mx-auto my-4">
        <Card className="bg-white border border-ceiba-line rounded-3xl shadow-md overflow-hidden text-center">
          <CardContent className="p-8 flex flex-col items-center">
            <XCircle className="w-18 h-18 text-ceiba-coral mb-4" />
            <h2 className="text-3xl font-extrabold text-ceiba-coral m-0">Pago Cancelado</h2>
            <p className="text-xs text-ceiba-ink/75 mt-2">
              Has cancelado el proceso de pago. Tu pedido no ha sido procesado.
            </p>

            <div className="my-6 px-6 py-4 bg-orange-50/50 border border-orange-200/60 rounded-xl text-left text-xs text-orange-850 leading-relaxed max-w-md">
              Los productos continúan guardados en tu carrito para que puedas completar tu compra en cualquier momento.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-4">
              <Link href="/menu/customer">
                <Button className="w-full bg-ceiba-ink hover:bg-ceiba-ink/90 text-white font-bold py-5 flex items-center gap-2 rounded-xl">
                  <ShoppingCart className="w-4 h-4" />
                  Ir al Menú
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
