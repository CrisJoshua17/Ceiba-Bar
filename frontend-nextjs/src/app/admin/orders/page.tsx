"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/axios';
import { NavbarAdmin } from '@/components/navbar-admin';
import { OrderDto } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, ClipboardList, ArrowLeft, User, Eye, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface DriverProfile {
  id: number;
  userId: string;
  userEmail: string;
  rating: number;
  totalDeliveries: number;
  available: boolean;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { authenticated, user, initialized } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Dialog states
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<OrderDto | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [notes, setNotes] = useState('');

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

  const loadOrdersAndDrivers = async () => {
    setLoadingOrders(true);
    try {
      const [ordersResp, driversResp] = await Promise.all([
        api.get('/api/orders/all'),
        api.get('/api/drivers'),
      ]);

      if (ordersResp.data?.success) {
        setOrders(ordersResp.data.data || []);
      }
      if (driversResp.data?.success) {
        setDrivers(driversResp.data.data || []);
      }
    } catch (err) {
      console.error('Error loading orders or drivers:', err);
      toast.error('Error al conectar con el servidor.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (authenticated && user?.primaryRole === 'ADMIN') {
      loadOrdersAndDrivers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user]);

  const handleOpenAssign = (order: OrderDto) => {
    setOrderToAssign(order);
    setSelectedDriverId('');
    setNotes('');
    setAssignOpen(true);
  };

  const handleAssignDriver = async () => {
    if (!orderToAssign?.id || !selectedDriverId) {
      toast.error('Por favor, selecciona un repartidor.');
      return;
    }

    setAssigning(true);
    try {
      const response = await api.post('/api/delivery/assign', {
        orderId: orderToAssign.id,
        driverId: parseInt(selectedDriverId, 10),
        notes,
      });

      if (response.data?.success) {
        toast.success('Repartidor asignado correctamente!');
        setAssignOpen(false);
        loadOrdersAndDrivers();
      } else {
        toast.error(response.data?.message || 'Error al asignar repartidor.');
      }
    } catch (err) {
      console.error('Error assigning driver:', err);
      toast.error('Error de red al asignar repartidor.');
    } finally {
      setAssigning(false);
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

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return true;
    return (
      o.id?.toString().includes(s) ||
      o.customerName?.toLowerCase().includes(s) ||
      o.customerEmail?.toLowerCase().includes(s) ||
      o.status?.toLowerCase().includes(s)
    );
  });

  const getOrderTotal = (order: OrderDto) => {
    return order.products?.reduce((sum, p) => sum + p.price, 0) || 0;
  };

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarAdmin />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ceiba-line pb-6">
          <div className="space-y-2 text-left">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ceiba-leaf hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Panel
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-ceiba-ink flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-ceiba-leaf" />
              Historial de Pedidos & Reparto
            </h1>
            <p className="text-xs text-ceiba-ink/65 max-w-xl">
              Monitorea el estatus de las órdenes activas, visualiza la facturación acumulada y asigna repartidores a las entregas.
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceiba-ink/40" />
            <Input
              type="text"
              placeholder="Buscar por cliente, id, status..."
              className="pl-10 bg-white border-ceiba-line rounded-xl text-xs py-5 focus-visible:ring-ceiba-leaf"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-ceiba-leaf animate-spin" />
            <p className="text-xs text-ceiba-ink/65">Obteniendo listado de órdenes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-ceiba-line rounded-3xl bg-white/50">
            <div className="w-12 h-12 rounded-full bg-ceiba-cream flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-ceiba-ink/40" />
            </div>
            <div>
              <p className="text-base font-semibold text-ceiba-ink">No se encontraron pedidos</p>
              <p className="text-xs text-ceiba-ink/60 mt-1">
                Las compras de tus clientes aparecerán en esta sección.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-ceiba-line rounded-3xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-ceiba-line bg-ceiba-cream/15">
                  <TableHead className="text-xs font-bold text-ceiba-ink w-[80px]">Orden ID</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Cliente</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Total</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Repartidor</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Estado</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-ceiba-cream/10 border-ceiba-line/50">
                    <TableCell className="text-xs font-extrabold text-ceiba-ink py-4">#{order.id}</TableCell>
                    <TableCell className="text-xs text-ceiba-ink font-semibold py-4">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-xs text-ceiba-leaf py-4 font-extrabold">
                      ${getOrderTotal(order).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-ceiba-ink/70 py-4 font-semibold">
                      {order.driverName || (
                        <span className="text-[10px] text-ceiba-coral font-bold italic">No Asignado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-4">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right py-4 space-x-1.5 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg px-2 text-ceiba-ink hover:bg-ceiba-cream"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {(order.status === 'CREATED' || order.status === 'PAGADO') && !order.driverId && (
                        <Button
                          size="sm"
                          className="h-8 bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white rounded-lg px-3 flex items-center gap-1 font-semibold text-xs cursor-pointer shadow-xs"
                          onClick={() => handleOpenAssign(order)}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Asignar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
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
            <div className="space-y-2.5 p-4 bg-ceiba-cream/40 rounded-2xl border border-ceiba-line">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/65">Cliente:</span>
                <span className="font-extrabold text-ceiba-ink">{selectedOrder?.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/65">Email:</span>
                <span className="font-semibold text-ceiba-ink/85">{selectedOrder?.customerEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/65">Dirección:</span>
                <span className="font-semibold text-ceiba-ink mt-0.5 block truncate max-w-[180px]" title={selectedOrder?.address}>
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
                      <TableHead className="text-xs font-bold text-right py-2">Precio</TableHead>
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

      {/* Driver Assignment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-white border-ceiba-line rounded-3xl sm:max-w-md text-ceiba-ink p-6">
          <DialogHeader className="border-b border-ceiba-line pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              Asignar Repartidor
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            <p className="text-xs text-ceiba-ink/75">
              Selecciona un repartidor disponible para entregar el pedido #{orderToAssign?.id}.
            </p>

            {/* Select Driver */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Repartidores</Label>
              <Select value={selectedDriverId} onValueChange={(val: any) => setSelectedDriverId(val || '')}>
                <SelectTrigger className="border-ceiba-line rounded-xl focus:ring-ceiba-leaf">
                  <SelectValue placeholder="Selecciona un repartidor" />
                </SelectTrigger>
                <SelectContent className="bg-white border-ceiba-line max-h-56 overflow-y-auto">
                  {drivers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-ceiba-ink/50">No hay repartidores creados</div>
                  ) : (
                    drivers.map((drv) => (
                      <SelectItem key={drv.id} value={drv.id.toString()}>
                        {drv.userEmail} ({drv.available ? 'Disponible' : 'Ocupado'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="assignNotes" className="text-xs font-bold">Notas de la asignación (Opcional)</Label>
              <Input
                id="assignNotes"
                type="text"
                placeholder="Ej. Llevar con cuidado, cliente habitual"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf py-5 text-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-ceiba-line pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-ceiba-line text-ceiba-ink rounded-xl"
              onClick={() => setAssignOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={assigning || !selectedDriverId}
              className="bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold rounded-xl"
              onClick={handleAssignDriver}
            >
              {assigning ? 'Asignando...' : 'Confirmar Asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
