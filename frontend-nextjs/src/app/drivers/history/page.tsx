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
import { Search, Loader2, MapPin, Truck, Eye, History } from 'lucide-react';

export default function DriverHistoryPage() {
  const router = useRouter();
  const { authenticated, profile, fetchProfile, initialized } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [deliveries, setDeliveries] = useState<DeliveryDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog details state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDto | null>(null);

  useEffect(() => {
    if (initialized && !authenticated) {
      router.push('/login');
    }
  }, [initialized, authenticated, router]);

  const loadDeliveries = async () => {
    const driverId = profile?.driver?.id;
    if (!driverId) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/delivery/driver/${driverId}`);
      if (response.data?.success) {
        // Filtramos solo entregas terminadas
        const finished = (response.data.data || []).filter(
          (d: DeliveryDto) => d.status === 'ENTREGADO' || d.status === 'CANCELADO'
        );
        setDeliveries(finished);
      }
    } catch (err) {
      console.error('Error fetching driver deliveries:', err);
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ENTREGADO':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-semibold">Entregado</Badge>;
      case 'CANCELADO':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-semibold">Cancelado</Badge>;
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
              <History className="w-8 h-8 text-ceiba-leaf" />
              Historial de Entregas
            </h1>
            <p className="text-xs text-ceiba-ink/65 max-w-xl">
              Consulta el registro histórico de todos los pedidos entregados o cancelados a lo largo de tu servicio.
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceiba-ink/40" />
            <Input
              type="text"
              placeholder="Buscar por cliente o ID..."
              className="pl-10 bg-white border-ceiba-line rounded-xl text-xs py-5 focus-visible:ring-ceiba-leaf"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-ceiba-leaf animate-spin" />
            <p className="text-xs text-ceiba-ink/65">Obteniendo historial...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-ceiba-line rounded-3xl bg-white/50">
            <div className="w-12 h-12 rounded-full bg-ceiba-cream flex items-center justify-center">
              <History className="w-6 h-6 text-ceiba-ink/40" />
            </div>
            <div>
              <p className="text-base font-semibold text-ceiba-ink">No hay entregas registradas</p>
              <p className="text-xs text-ceiba-ink/60 mt-1">
                Tus entregas completadas aparecerán aquí.
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
                        className="h-8 rounded-lg px-3 text-ceiba-ink hover:bg-ceiba-cream flex items-center gap-1 font-semibold text-xs cursor-pointer"
                        onClick={() => handleOpenDetails(delivery)}
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </Button>
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
              Detalle de Ruta Histórica #{selectedDelivery?.orderId}
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
                <span className="font-bold text-ceiba-ink/65">Entregado el:</span>
                <span className="font-semibold text-ceiba-ink/80">
                  {selectedDelivery?.completedAt
                    ? new Date(selectedDelivery.completedAt).toLocaleString()
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
