"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Map as MapIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapTrackingProps {
  orderId: number;
}

export default function MapTracking({ orderId }: MapTrackingProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState('Conectando al servidor...');
  const [distance, setDistance] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [addressSent, setAddressSent] = useState(false);
  const [sendingAddress, setSendingAddress] = useState(false);

  // Custom marker icons
  const driverIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/7542/7542670.png', // Delivery Truck
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const destIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Red Pin
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
  });

  const deliveredIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', // Green check mark/success
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
  });

  // Query order details
  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ['orderTracking', orderId],
    queryFn: async () => {
      const response = await api.get(`/api/orders/${orderId}`);
      if (response.data?.success) {
        return response.data.data;
      }
      return null;
    },
    refetchInterval: 15000, // Refresh order status every 15s
  });

  // Init leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Create map
      const map = L.map(mapContainerRef.current).setView([19.4326, -99.1332], 14);
      mapRef.current = map;

      // Add OSM tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Create driver marker
      const driverMarker = L.marker([19.4326, -99.1332], { icon: driverIcon })
        .addTo(map)
        .bindPopup('<b>Repartidor</b><br/>Ubicación actual')
        .openPopup();
      driverMarkerRef.current = driverMarker;

      // Route polyline
      const routeLine = L.polyline([], {
        color: '#2f7d62', // Ceiba Leaf
        weight: 5,
        opacity: 0.8,
        dashArray: '10, 10',
      }).addTo(map);
      routeLineRef.current = routeLine;

      // Force refresh size
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } catch (error) {
      console.error('Error initializing Leaflet map:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update order fields
  useEffect(() => {
    if (order) {
      if (order.address) {
        setAddress(order.address);
      }
      if (order.status === 'EN_CAMINO' || order.status === 'PREPARING') {
        setAddressSent(true);
        setStatus(order.status === 'PREPARING' ? 'Preparando pedido...' : 'Repartidor en camino...');
      }
    }
  }, [order]);

  // Connect WebSocket & fetch latest coords
  useEffect(() => {
    if (!mapRef.current || !addressSent) return;

    // Load destination coordinate
    const fetchLatestTracking = async () => {
      try {
        const response = await api.get(`/api/tracking/${orderId}/latest`);
        if (response.data?.success && response.data?.data) {
          const t = response.data.data;
          if (t.deliveryLat && t.deliveryLng) {
            setupDestination(t.deliveryLat, t.deliveryLng);
          }
        }
      } catch (err) {
        console.error('Error loading latest tracking info:', err);
      }
    };

    fetchLatestTracking();

    // Setup WebSocket
    const wsUrl = `${config.wsTracking}?orderId=${orderId}`;
    console.log('🔌 Connecting WebSocket to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connection established');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);

        if (data.lat && data.lng) {
          updateDriverPosition(data.lat, data.lng, data.status);
        }
      } catch (err) {
        console.error('Error parsing WebSocket data:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket connection closed');
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressSent, orderId]);

  const setupDestination = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const destLatLng = L.latLng(lat, lng);

      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current);
      }

      const destMarker = L.marker(destLatLng, { icon: destIcon })
        .addTo(map)
        .bindPopup('<b>Destino de Entrega</b>')
        .openPopup();
      destinationMarkerRef.current = destMarker;

      // Clear old route line points
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs([]);
      }

      // Adjust viewport to fit driver & destination
      if (driverMarkerRef.current) {
        const driverLatLng = driverMarkerRef.current.getLatLng();
        map.fitBounds(L.latLngBounds([driverLatLng, destLatLng]), { padding: [50, 50] });
      }
    } catch (err) {
      console.error('Error setting up destination:', err);
    }
  };

  const updateDriverPosition = (lat: number, lng: number, driverStatus: string) => {
    const map = mapRef.current;
    const driverMarker = driverMarkerRef.current;
    const routeLine = routeLineRef.current;

    if (!map || !driverMarker) return;

    try {
      const latlng = L.latLng(lat, lng);
      driverMarker.setLatLng(latlng);

      if (routeLine) {
        const points = routeLine.getLatLngs() as L.LatLng[];
        points.push(latlng);
        routeLine.setLatLngs(points);
      }

      if (destinationMarkerRef.current) {
        const destLatLng = destinationMarkerRef.current.getLatLng();
        const dist = map.distance(latlng, destLatLng) / 1000;
        setDistance(dist);

        if (driverStatus === 'ENTREGADO') {
          setStatus('¡Pedido Entregado! 🎉');
          destinationMarkerRef.current.setIcon(deliveredIcon);
          destinationMarkerRef.current.bindPopup('<b>¡Entregado! 🎉</b>').openPopup();
          driverMarker.bindPopup('<b>¡Pedido Entregado! 🎉</b>').openPopup();
          toast.success('El pedido ha sido entregado exitosamente.');
          wsClose();
        } else {
          setStatus(`Repartidor en camino... (${dist.toFixed(2)} km restantes)`);
        }
      }

      map.panTo(latlng);
    } catch (err) {
      console.error('Error updating driver position:', err);
    }
  };

  const wsClose = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  const sendAddress = async () => {
    if (!address.trim()) return;

    setSendingAddress(true);
    setStatus('Iniciando envío...');

    try {
      const response = await api.post(
        `/api/delivery/${orderId}/address`,
        { address },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      toast.success('Dirección registrada. Buscando repartidor...');
      setAddressSent(true);
      setStatus('Repartidor en camino...');

      // Load destination coordinate
      setTimeout(async () => {
        try {
          const trackingResp = await api.get(`/api/tracking/${orderId}/latest`);
          if (trackingResp.data?.success && trackingResp.data?.data) {
            const t = trackingResp.data.data;
            if (t.deliveryLat && t.deliveryLng) {
              setupDestination(t.deliveryLat, t.deliveryLng);
            }
          }
        } catch (e) {
          console.warn('Destination coords not ready yet, waiting for GPS websocket updates.');
        }
      }, 1000);
    } catch (err) {
      console.error('Error registering address:', err);
      toast.error('Error al enviar la dirección.');
      setStatus('Error al enviar dirección');
    } finally {
      setSendingAddress(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-white border border-ceiba-line rounded-3xl p-6 shadow-md">
        <Loader2 className="w-8 h-8 text-ceiba-leaf animate-spin" />
        <p className="text-xs text-ceiba-ink/65">Obteniendo estado del envío...</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-stretch">
      {/* Control Panel (Left) */}
      <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
        <Card className="bg-white border border-ceiba-line rounded-3xl shadow-md p-6 space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-4 text-left">
            <div>
              <span className="text-[9px] bg-ceiba-leaf/10 text-ceiba-leaf px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Pedido #{orderId}
              </span>
              <h2 className="text-xl font-bold text-ceiba-ink mt-2">Seguimiento de Entrega</h2>
            </div>

            <div className="space-y-1.5 p-4 bg-ceiba-cream/50 rounded-2xl border border-ceiba-line text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/60">Cliente:</span>
                <span className="font-extrabold text-ceiba-ink">{order?.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/60">Método:</span>
                <span className="font-extrabold text-ceiba-leaf">Stripe Checkout</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ceiba-ink/60">Estado de Orden:</span>
                <Badge className="bg-ceiba-ink text-white text-[9px] border-none">
                  {order?.status || 'CREATED'}
                </Badge>
              </div>
            </div>

            {/* Address Form or Display */}
            {!addressSent ? (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Dirección de Entrega</Label>
                  <textarea
                    className="w-full bg-ceiba-paper border border-ceiba-line rounded-xl p-3 text-xs min-h-[70px] focus:outline-none focus:ring-1 focus:ring-ceiba-leaf text-ceiba-ink font-semibold"
                    placeholder="Calle, Colonia, Código Postal..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <Button
                  onClick={sendAddress}
                  disabled={sendingAddress || !address.trim()}
                  className="w-full bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold py-5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md"
                >
                  {sendingAddress ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  Iniciar Entrega
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold text-ceiba-ink/60 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-ceiba-leaf" /> Dirección Enviada
                </Label>
                <p className="text-xs font-semibold text-ceiba-ink leading-relaxed p-3 bg-ceiba-paper border border-ceiba-line rounded-xl">
                  {address}
                </p>
              </div>
            )}
          </div>

          {/* Status and distance display */}
          {addressSent && (
            <div className="border-t border-ceiba-line pt-5 mt-6 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ceiba-ink/60">Estado del Reparto:</span>
                <span className="font-extrabold text-ceiba-leaf animate-pulse">{status}</span>
              </div>

              {distance !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ceiba-ink/60">Distancia restante:</span>
                  <span className="font-extrabold text-ceiba-ink">{distance.toFixed(2)} km</span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Map (Right) */}
      <div className="lg:col-span-8 relative min-h-[450px] lg:min-h-0 bg-white border border-ceiba-line rounded-3xl overflow-hidden shadow-md">
        <div ref={mapContainerRef} className="absolute inset-0 z-10" />
      </div>
    </div>
  );
}
