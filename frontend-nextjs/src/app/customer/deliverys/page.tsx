"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/axios';
import { NavbarCustomer } from '@/components/navbar-customer';
import { OrderDto } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, MapPin, Truck, Star, Eye, StarHalf, Heart } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CustomerDeliveriesPage() {
  const router = useRouter();
  const { authenticated, profile, fetchProfile, initialized } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Dialog details state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  // Rating state
  const [ratingOpen, setRatingOpen] = useState(false);
  const [orderToRate, setOrderToRate] = useState<OrderDto | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (initialized && !authenticated) {
      router.push('/login');
    }
  }, [initialized, authenticated, router]);

  const loadOrders = async () => {
    const customerId = profile?.customer?.id;
    if (!customerId) return;

    setLoadingOrders(true);
    try {
      const response = await api.get(`/api/orders/user/${customerId}`);
      if (response.data?.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data?.message || 'Error al obtener tus pedidos.');
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      toast.error('Error de comunicación con el microservicio de pedidos.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (profile?.customer?.id) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleRateOrder = (order: OrderDto) => {
    setOrderToRate(order);
    setRatingVal(5);
    setFeedback('');
    setRatingOpen(true);
  };

  const submitRating = async () => {
    if (!orderToRate?.id) return;

    setSubmittingRating(true);
    try {
      const response = await api.post(`/api/orders/${orderToRate.id}/rate`, {
        rating: ratingVal,
        feedback,
      });

      if (response.data?.success) {
        toast.success('¡Calificación guardada exitosamente!');
        setRatingOpen(false);
        loadOrders(); // reload
      } else {
        toast.error(response.data?.message || 'No se pudo guardar la calificación.');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      toast.error('Error al enviar la calificación.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'CREATED':
      case 'PAGADO':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-semibold">Creado / Pagado</Badge>;
      case 'PREPARING':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-semibold">Preparando</Badge>;
      case 'EN_CAMINO':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none font-semibold animate-pulse">En Camino</Badge>;
      case 'ENTREGADO':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-semibold">Entregado</Badge>;
      case 'CANCELADO':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-semibold">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none font-semibold">{status}</Badge>;
    }
  };

  // Filter orders by search & tab
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.id?.toString().includes(searchQuery.trim());
    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'active') {
      return o.status === 'CREATED' || o.status === 'PAGADO' || o.status === 'PREPARING' || o.status === 'EN_CAMINO';
    }
    if (activeTab === 'delivered') return o.status === 'ENTREGADO';
    if (activeTab === 'cancelled') return o.status === 'CANCELADO';
    return true;
  });

  const handleOpenDetails = (order: OrderDto) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarCustomer />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ceiba-line pb-6">
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-ceiba-ink flex items-center gap-2">
              <Truck className="w-8 h-8 text-ceiba-leaf" />
              Mis Pedidos
            </h1>
            <p className="text-xs text-ceiba-ink/60 max-w-xl">
              Monitorea tus órdenes activas en el mapa o califica las entregas que ya hayas recibido.
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceiba-ink/40" />
            <Input
              type="text"
              placeholder="Buscar por ID..."
              className="pl-10 bg-white border-ceiba-line rounded-xl text-xs py-5 focus-visible:ring-ceiba-leaf"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 bg-ceiba-cream p-1 rounded-2xl max-w-md border border-ceiba-line">
            <TabsTrigger value="all" className="rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-ceiba-ink data-[state=active]:text-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-ceiba-ink data-[state=active]:text-white">
              Activos
            </TabsTrigger>
            <TabsTrigger value="delivered" className="rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-ceiba-ink data-[state=active]:text-white">
              Entregados
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-ceiba-ink data-[state=active]:text-white">
              Cancelados
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 text-ceiba-leaf animate-spin" />
                <p className="text-xs text-ceiba-ink/65">Cargando tus órdenes...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-ceiba-line rounded-3xl bg-white/50">
                <div className="w-12 h-12 rounded-full bg-ceiba-cream flex items-center justify-center">
                  <Truck className="w-6 h-6 text-ceiba-ink/40" />
                </div>
                <div>
                  <p className="text-base font-semibold text-ceiba-ink">No se encontraron pedidos</p>
                  <p className="text-xs text-ceiba-ink/60 mt-1">
                    Prueba cambiando de pestaña o realizando una compra desde el menú.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-ceiba-line rounded-3xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-ceiba-line">
                      <TableHead className="text-xs font-bold text-ceiba-ink w-[100px]">ID Pedido</TableHead>
                      <TableHead className="text-xs font-bold text-ceiba-ink">Dirección</TableHead>
                      <TableHead className="text-xs font-bold text-ceiba-ink">Productos</TableHead>
                      <TableHead className="text-xs font-bold text-ceiba-ink">Estado</TableHead>
                      <TableHead className="text-xs font-bold text-ceiba-ink text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-ceiba-cream/10 border-ceiba-line/50">
                        <TableCell className="text-xs font-extrabold text-ceiba-ink py-4">#{order.id}</TableCell>
                        <TableCell className="text-xs text-ceiba-ink/80 max-w-[200px] truncate font-medium">
                          {order.address}
                        </TableCell>
                        <TableCell className="text-xs text-ceiba-ink/75 font-medium">
                          {order.products?.map((p) => p.name).join(', ') || 'Sin productos'}
                        </TableCell>
                        <TableCell className="text-xs py-4">{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right py-4 space-x-1.5 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg px-2 text-ceiba-ink hover:bg-ceiba-cream"
                            onClick={() => handleOpenDetails(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {(order.status === 'EN_CAMINO' || order.status === 'PREPARING') && (
                            <Link href={`/map/${order.id}`}>
                              <Button
                                size="sm"
                                className="h-8 bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white rounded-lg px-3 flex items-center gap-1 font-semibold text-xs cursor-pointer shadow-xs"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                Mapa
                              </Button>
                            </Link>
                          )}

                          {order.status === 'ENTREGADO' && !order.rating && (
                            <Button
                              size="sm"
                              className="h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 flex items-center gap-1 font-semibold text-xs cursor-pointer shadow-xs"
                              onClick={() => handleRateOrder(order)}
                            >
                              <Star className="w-3.5 h-3.5" />
                              Calificar
                            </Button>
                          )}

                          {order.rating && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-extrabold text-[10px] h-8 flex items-center gap-0.5 px-2.5">
                              {order.rating} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-white border-ceiba-line rounded-3xl sm:max-w-md text-ceiba-ink p-6">
          <DialogHeader className="border-b border-ceiba-line pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              Detalle del Pedido #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs text-left">
            <div className="grid grid-cols-2 gap-3 p-4 bg-ceiba-cream/40 rounded-2xl border border-ceiba-line">
              <div>
                <span className="font-bold text-ceiba-ink/60 block">Estado actual:</span>
                <span className="font-extrabold text-ceiba-ink mt-0.5 block">
                  {selectedOrder?.status}
                </span>
              </div>
              <div>
                <span className="font-bold text-ceiba-ink/60 block">Dirección:</span>
                <span className="font-semibold text-ceiba-ink mt-0.5 block truncate max-w-[150px]" title={selectedOrder?.address}>
                  {selectedOrder?.address}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-ceiba-ink/80 block">Productos en esta orden:</span>
              <div className="border border-ceiba-line rounded-xl overflow-hidden bg-ceiba-paper/30">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-ceiba-line bg-ceiba-cream/35">
                      <TableHead className="text-xs font-bold py-2">Producto</TableHead>
                      <TableHead className="text-xs font-bold text-right py-2">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder?.products?.map((p, idx) => (
                      <TableRow key={idx} className="hover:bg-transparent border-ceiba-line/50">
                        <TableCell className="py-2.5 font-medium">{p.name}</TableCell>
                        <TableCell className="py-2.5 text-right font-bold">${p.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {selectedOrder?.driverName && (
              <div className="p-3 bg-ceiba-leaf/5 border border-ceiba-leaf/20 rounded-xl space-y-1">
                <span className="font-bold text-ceiba-leaf block">Repartidor Asignado</span>
                <span className="font-semibold text-ceiba-ink block">
                  {selectedOrder.driverName}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-ceiba-line pt-3">
            <Button
              type="button"
              className="bg-ceiba-ink hover:bg-ceiba-ink/90 text-white rounded-xl"
              onClick={() => setDetailOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="bg-white border-ceiba-line rounded-3xl sm:max-w-md text-ceiba-ink p-6">
          <DialogHeader className="border-b border-ceiba-line pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-ceiba-ink">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Calificar Entrega
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-center">
            <p className="text-xs text-ceiba-ink/70">
              ¿Qué tal fue tu experiencia con el pedido #{orderToRate?.id}? Califica al repartidor y dinos qué te pareció.
            </p>

            {/* Stars Selector */}
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRatingVal(val)}
                  className="transition-transform active:scale-95 cursor-pointer outline-none"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      ratingVal >= val
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-ceiba-line hover:text-amber-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Feedback Input */}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="feedback" className="text-xs font-bold text-ceiba-ink/80">
                Comentario (Opcional)
              </Label>
              <Input
                id="feedback"
                type="text"
                placeholder="Ej. El repartidor fue muy amable, llegó a tiempo."
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf py-5 text-xs"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-ceiba-line pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-ceiba-line text-ceiba-ink rounded-xl"
              onClick={() => setRatingOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={submittingRating}
              className="bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold rounded-xl"
              onClick={submitRating}
            >
              {submittingRating ? 'Enviando...' : 'Enviar Calificación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-ceiba-ink text-ceiba-paper py-10 mt-auto border-t border-ceiba-line/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-ceiba-paper/50">
          © {new Date().getFullYear()} Ceiba Bar. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
