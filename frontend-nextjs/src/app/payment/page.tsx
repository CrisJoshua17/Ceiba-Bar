"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { api } from '@/lib/axios';
import { NavbarCustomer } from '@/components/navbar-customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, DollarSign, Wallet, ArrowLeft, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { CheckoutRequest, OrderDto, ProductDto } from '@/types';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, clearCart } = useCartStore();
  const { authenticated, user, profile, fetchProfile, initialized } = useAuthStore();

  // Form states
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [colonia, setColonia] = useState('');
  const [delegacion, setDelegacion] = useState('');
  const [cp, setCp] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [processingStripe, setProcessingStripe] = useState(false);
  const [processingPaypal, setProcessingPaypal] = useState(false);

  useEffect(() => {
    if (initialized && !authenticated) {
      router.push('/login');
    }
  }, [initialized, authenticated, router]);

  useEffect(() => {
    if (authenticated) {
      fetchProfile();
    }
  }, [authenticated, fetchProfile]);

  useEffect(() => {
    if (profile?.user) {
      const u = profile.user;
      setName(u.name || '');
      setLastName(u.lastName || '');
      setEmail(u.email || '');
      setPhone(u.phone || '');

      const defaultAddress = profile.customer?.addresses?.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setStreet(defaultAddress.street || '');
        setColonia(defaultAddress.colonia || '');
        setDelegacion(defaultAddress.delegacion || '');
        setCp(defaultAddress.postalCode || '');
      }
    }
  }, [profile]);

  const total = getCartTotal();

  const handleCheckout = async (method: 'STRIPE' | 'PAYPAL') => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío.');
      return;
    }

    if (!street || !colonia || !delegacion || !cp) {
      toast.error('Por favor, ingresa una dirección completa.');
      return;
    }

    if (method === 'STRIPE') setProcessingStripe(true);
    else setProcessingPaypal(true);

    const productsDto: ProductDto[] = cartItems.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: item.product.price,
      image: item.product.image || '',
      available: item.product.available,
      quantity: item.quantity,
    }));

    const orderDto: OrderDto = {
      userId: profile?.user?.id,
      customerId: profile?.customer?.id,
      customerName: `${name} ${lastName}`,
      customerEmail: email,
      address: `${street}, ${colonia}, ${delegacion}, ${cp}`,
      destinationLat: 0,
      destinationLng: 0,
      products: productsDto,
      status: 'CREATED',
    };

    const checkoutRequest: CheckoutRequest = {
      orderDto,
      itemProduct: `Pedido de ${name}`,
      method,
    };

    try {
      const response = await api.post('/api/payments/checkout', checkoutRequest);
      if (response.data?.success && response.data?.data) {
        // Redirigir a pasarela de pago (Stripe/PayPal URL)
        window.location.href = response.data.data;
      } else {
        toast.error(`Error al iniciar pago: ${response.data?.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Error de comunicación con la pasarela de pagos.');
    } finally {
      setProcessingStripe(false);
      setProcessingPaypal(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
        <NavbarCustomer />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
          <p className="text-xs text-ceiba-ink/65">Preparando Checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarCustomer />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-left space-y-2 border-b border-ceiba-line pb-6">
          <Link
            href="/menu/customer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ceiba-leaf hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Menú
          </Link>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-ceiba-leaf" />
            Finalizar Compra
          </h1>
          <p className="text-xs text-ceiba-ink/60">
            Revisa los detalles de tu pedido, ingresa la dirección de entrega y selecciona tu método de pago.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Billing Form (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-white border-ceiba-line rounded-3xl shadow-md">
              <CardContent className="p-8 space-y-6">
                <h2 className="text-lg font-bold text-ceiba-ink border-b border-ceiba-line pb-3">
                  Detalles de Facturación & Envío
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold text-ceiba-ink/85">Nombre</Label>
                    <Input
                      disabled
                      className="bg-ceiba-cream/45 border-ceiba-line rounded-xl cursor-not-allowed text-ceiba-ink/60"
                      value={name}
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold text-ceiba-ink/85">Apellidos</Label>
                    <Input
                      disabled
                      className="bg-ceiba-cream/45 border-ceiba-line rounded-xl cursor-not-allowed text-ceiba-ink/60"
                      value={lastName}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold text-ceiba-ink/85">Correo Electrónico</Label>
                    <Input
                      disabled
                      className="bg-ceiba-cream/45 border-ceiba-line rounded-xl cursor-not-allowed text-ceiba-ink/60"
                      value={email}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold text-ceiba-ink/85">Teléfono</Label>
                    <Input
                      disabled
                      className="bg-ceiba-cream/45 border-ceiba-line rounded-xl cursor-not-allowed text-ceiba-ink/60"
                      value={phone}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Street */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold text-ceiba-ink/85">Calle con Número</Label>
                    <Input
                      className="bg-ceiba-paper/50 border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Dirección completa"
                    />
                  </div>

                  {/* Colonia */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold text-ceiba-ink/85">Colonia</Label>
                    <Input
                      className="bg-ceiba-paper/50 border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                      value={colonia}
                      onChange={(e) => setColonia(e.target.value)}
                      placeholder="Colonia"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Delegacion */}
                    <div className="space-y-1.5 text-left">
                      <Label className="text-xs font-bold text-ceiba-ink/85">Delegación / Municipio</Label>
                      <Input
                        className="bg-ceiba-paper/50 border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                        value={delegacion}
                        onChange={(e) => setDelegacion(e.target.value)}
                        placeholder="Delegación"
                      />
                    </div>

                    {/* CP */}
                    <div className="space-y-1.5 text-left">
                      <Label className="text-xs font-bold text-ceiba-ink/85">Código Postal</Label>
                      <Input
                        className="bg-ceiba-paper/50 border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                        value={cp}
                        onChange={(e) => setCp(e.target.value)}
                        placeholder="Código Postal"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-ceiba-line pt-5 text-left">
                  <h3 className="font-bold text-xs text-ceiba-ink/85">Información Adicional</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="orderNotes" className="text-xs font-bold text-ceiba-ink/60">
                      Notas del Pedido (Opcional)
                    </Label>
                    <Textarea
                      id="orderNotes"
                      className="bg-ceiba-paper/50 border-ceiba-line rounded-xl min-h-[80px] focus-visible:ring-ceiba-leaf"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Instrucciones especiales para la entrega."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Summary & Payments (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Order Preview */}
            <Card className="bg-white border-ceiba-line rounded-3xl shadow-md overflow-hidden">
              <CardContent className="p-6">
                <h3 className="font-bold text-sm text-ceiba-ink border-b border-ceiba-line pb-3 mb-4">
                  Tu Pedido
                </h3>

                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-ceiba-line">
                      <TableHead className="text-xs font-bold text-ceiba-ink">Producto</TableHead>
                      <TableHead className="text-xs font-bold text-ceiba-ink text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.product.id} className="hover:bg-transparent border-ceiba-line/50">
                        <TableCell className="text-xs py-3.5 text-ceiba-ink/80 font-medium">
                          {item.product.name} <span className="font-bold text-ceiba-leaf">x {item.quantity}</span>
                        </TableCell>
                        <TableCell className="text-xs py-3.5 text-right font-bold text-ceiba-ink">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-ceiba-cream/30 border-t border-ceiba-line">
                    <TableRow>
                      <TableCell className="text-xs font-extrabold text-ceiba-ink py-4">Total</TableCell>
                      <TableCell className="text-xs font-extrabold text-ceiba-leaf text-right py-4">
                        ${total.toFixed(2)} MXN
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card className="bg-white border-ceiba-line rounded-3xl shadow-md overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-sm text-ceiba-ink border-b border-ceiba-line pb-3 mb-3">
                  Método de Pago
                </h3>

                <p className="text-[11px] text-ceiba-ink/60 leading-relaxed text-left">
                  Tus datos personales se utilizarán para procesar tu pedido, mejorar tu experiencia en esta web y otros propósitos descritos en nuestra política de privacidad.
                </p>

                <div className="flex flex-col gap-3 pt-3">
                  <Button
                    onClick={() => handleCheckout('STRIPE')}
                    disabled={processingStripe || processingPaypal}
                    className="w-full bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <CreditCard className="w-4 h-4" />
                    {processingStripe ? 'Procesando Stripe...' : 'Pagar con Stripe'}
                  </Button>

                  <Button
                    onClick={() => handleCheckout('PAYPAL')}
                    disabled={processingStripe || processingPaypal}
                    className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md border-none"
                  >
                    <Wallet className="w-4 h-4" />
                    {processingPaypal ? 'Procesando PayPal...' : 'Pagar con PayPal'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
