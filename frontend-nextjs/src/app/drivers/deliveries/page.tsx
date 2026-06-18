"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/axios';
import { NavbarDriver } from '@/components/navbar-driver';
import { DeliveryDto } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, MapPin, Truck, Check, X, Eye, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DriverDeliveriesPage() {
  const router = useRouter();
  const { authenticated, user, profile, fetchProfile, initialized } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [deliveries, setDeliveries] = useState<DeliveryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Dialog details state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDto | null>(null);

  useEffect(() => {
    if (initialized) {
      if (!authenticated) {
        router.push('/login');
      } else if (user?.primaryRole !== 'DRIVER') {
        if (user?.primaryRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/customer/dashboard');
        }
      }
    }
  }, [initialized, authenticated, user, router]);

  useEffect(() => {
    if (authenticated && user?.primaryRole === 'DRIVER' && !profile) {
      fetchProfile();
    }
  }, [authenticated, user, profile, fetchProfile]);

  const loadDeliveries = async () => {
    const driverId = profile?.driver?.id;
    if (!driverId) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/delivery/driver/${driverId}`);
      if (response.data?.success) {
        // Filtramos solo entregas activas
        const active = (response.data.data || []).filter(
          (d: DeliveryDto) =>
            d.status === 'CREATED' ||
            d.status === 'PAGADO' ||
            d.status === 'PREPARING' ||
            d.status === 'EN_CAMINO'
        );
        setDeliveries(active);
      }
    } catch (err) {
      console.error('Error fetching driver deliveries:', err);
      toast.error('Error de comunicación al cargar entregas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.driver?.id) {
      loadDeliveries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleStartDelivery = async (delivery: DeliveryDto) => {
    setUpdatingId(delivery.id);
    try {
      const response = await api.put(`/api/delivery/${delivery.id}/start`, {});
      if (response.data?.success) {
        toast.success('Ruta iniciada. Abriendo mapa de seguimiento...');
        router.push(`/map/${delivery.orderId}`);
      } else {
        toast.error(response.data?.message || 'No se pudo iniciar la entrega.');
      }
    } catch (err) {
      console.error('Error starting delivery:', err);
      toast.error('Error de red al iniciar la entrega.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (deliveryId: number, status: 'complete' | 'cancel') => {
    setUpdatingId(deliveryId);
    try {
      const response = await api.put(`/api/delivery/${deliveryId}/${status}`, {});
      if (response.data?.success) {
        toast.success(`Entrega actualizada a ${status === 'complete' ? 'ENTREGADA' : 'CANCELADA'}`);
        loadDeliveries();
      } else {
        toast.error(response.data?.message || 'Error al actualizar entrega.');
      }
    } catch (err) {
      console.error('Error updating delivery:', err);
      toast.error('Error al conectar con el servidor.');
    } finally {
      setUpdatingId(null);
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
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none font-semibold">{status}</Badge>;
    }
  };

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return true;
    return (
      d.orderId?.toString().includes(s) ||
      d.customerName?.toLowerCase().includes(s) ||
      d.customerEmail?.toLowerCase().includes(s)
    );
  });

  const handleOpenDetails = (delivery: DeliveryDto) => {
    setSelectedDelivery(delivery);
    setDetailOpen(true);
  };

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
        <NavbarDriver />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
          <p className="text-xs text-ceiba-ink/65">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarDriver />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ceiba-line pb-6">
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-ceiba-ink flex items-center gap-2">
              <Truck className="w-8 h-8 text-ceiba-leaf" />
              Entregas Activas
            </h1>
            <p className="text-xs text-ceiba-ink/65 max-w-xl">
              Aquí verás las entregas asignadas a tu cuenta que aún no han concluido. Inicia la ruta de reparto o márcalas como entregadas.
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceiba-ink/40" />
            <Input
              type="text"
              placeholder="Buscar por cliente u orden..."
              className="pl-10 bg-white border-ceiba-line rounded-xl text-xs py-5 focus-visible:ring-ceiba-leaf"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-ceiba-leaf animate-spin" />
            <p className="text-xs text-ceiba-ink/65">Obteniendo tu ruta de entregas...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-ceiba-line rounded-3xl bg-white/50">
            <div className="w-12 h-12 rounded-full bg-ceiba-cream flex items-center justify-center">
              <Truck className="w-6 h-6 text-ceiba-ink/40" />
            </div>
            <div>
              <p className="text-base font-semibold text-ceiba-ink">No tienes entregas activas</p>
              <p className="text-xs text-ceiba-ink/60 mt-1">
                Cuando el administrador te asigne un pedido, aparecerá en esta sección.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-ceiba-line rounded-3xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-ceiba-line">
                  <TableHead className="text-xs font-bold text-ceiba-ink w-[100px]">Orden ID</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Cliente</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Dirección</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Estado</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id} className="hover:bg-ceiba-cream/10 border-ceiba-line/50">
                    <TableCell className="text-xs font-extrabold text-ceiba-ink py-4">#{delivery.orderId}</TableCell>
                    <TableCell className="text-xs text-ceiba-ink font-semibold py-4">
                      {delivery.customerName}
                    </TableCell>
                    <TableCell className="text-xs text-ceiba-ink/80 max-w-[200px] truncate font-medium">
                      {delivery.address}
                    </TableCell>
                    <TableCell className="text-xs py-4">{getStatusBadge(delivery.status)}</TableCell>
                    <TableCell className="text-right py-4 space-x-1.5 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg px-2 text-ceiba-ink hover:bg-ceiba-cream"
                        onClick={() => handleOpenDetails(delivery)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {delivery.status !== 'EN_CAMINO' ? (
                        <Button
                          size="sm"
                          disabled={updatingId !== null}
                          className="h-8 bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white rounded-lg px-3 flex items-center gap-1 font-semibold text-xs cursor-pointer shadow-xs"
                          onClick={() => handleStartDelivery(delivery)}
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Iniciar Ruta
                        </Button>
                      ) : (
                        <div className="inline-flex gap-1.5">
                          <Link href={`/map/${delivery.orderId}`}>
                            <Button
                              size="sm"
                              className="h-8 bg-ceiba-ink hover:bg-ceiba-ink/90 text-white rounded-lg px-3 flex items-center gap-1 font-semibold text-xs cursor-pointer shadow-xs"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              Mapa
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            disabled={updatingId !== null}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 flex items-center gap-1 font-semibold text-xs cursor-pointer shadow-xs"
                            onClick={() => handleUpdateStatus(delivery.id, 'complete')}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Entregado
                          </Button>
                          <Button
                            size="sm"
                            disabled={updatingId !== null}
                            className="h-8 bg-ceiba-coral hover:bg-red-700 text-white rounded-lg px-3 flex items-center gap-1 font-semibold text-xs cursor-pointer shadow-xs"
                            onClick={() => handleUpdateStatus(delivery.id, 'cancel')}
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-white border-ceiba-line rounded-3xl sm:max-w-md text-ceiba-ink p-6">
          <DialogHeader className="border-b border-ceiba-line pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              Detalle de Ruta #{selectedDelivery?.orderId}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs text-left">
            <div className="space-y-2.5 p-4 bg-ceiba-cream/40 rounded-2xl border border-ceiba-line">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/65">Cliente:</span>
                <span className="font-extrabold text-ceiba-ink">{selectedDelivery?.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/65">Email:</span>
                <span className="font-semibold text-ceiba-ink/85">{selectedDelivery?.customerEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/65">Asignado el:</span>
                <span className="font-semibold text-ceiba-ink/80">
                  {selectedDelivery?.assignedAt
                    ? new Date(selectedDelivery.assignedAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-ceiba-ink/80 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-ceiba-leaf" /> Dirección Completa
              </span>
              <p className="p-3 bg-ceiba-paper border border-ceiba-line rounded-xl font-semibold leading-relaxed">
                {selectedDelivery?.address}
              </p>
            </div>

            {selectedDelivery?.notes && (
              <div className="space-y-1">
                <span className="font-bold text-ceiba-ink/80">Notas de entrega:</span>
                <p className="p-3 bg-red-50/50 border border-red-200/60 rounded-xl text-red-900 leading-relaxed font-semibold">
                  {selectedDelivery.notes}
                </p>
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
    </div>
  );
}
