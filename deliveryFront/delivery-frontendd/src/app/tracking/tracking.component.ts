import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as L from 'leaflet';
import { Subject, takeUntil, filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tracking } from '../model/Tracking';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../services/users.service';
import { BASE_ENDPOINT_MICRO_ORDERS, BASE_ENDPOINT_MICRO_DELIVERY, BASE_ENDPOINT_MICRO_TRACKING, WS_TRACKING } from '../utils/enviroments/enviroment';

import { NavbarCustomerComponent } from '../navbar-customer/navbar-customer.component';
import { NavbarDriverComponent } from '../navbar-driver/navbar-driver.component';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarCustomerComponent, NavbarDriverComponent, NavbarAdminComponent]
})
export class TrackingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map') mapElement!: ElementRef;

  private route = inject(ActivatedRoute);
  private usersService = inject(UsersService);
  private http = inject(HttpClient);
  private router = inject(Router);

  orderId: number = 0;
  address = '';
  addressSent = false;
  status = 'Esperando dirección...';
  distance: number | null = null;
  loading = false;

  // Verificación de invitados
  isVerified = false;
  emailInput = '';
  isGuest = true;
  verifying = false;

  private map!: L.Map;
  private driverMarker!: L.Marker;
  private destinationMarker!: L.Marker;
  private routeLine!: L.Polyline;
  private ws$!: WebSocketSubject<any>;
  private destroy$ = new Subject<void>();
  private mapInitialized = false;

  // Icono por defecto
  private iconDefault = L.icon({
    iconUrl: '/assets/images/marker-icon.png',
    iconSize: [41, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId = +params['id'];
      this.checkInitialVerification();
    });
  }

  checkInitialVerification() {
    const userData = this.usersService.userData();
    if (userData && userData.user) {
      this.isGuest = false;
      // Si está logueado, verificamos si la orden le pertenece
      this.http.get<any>(`${BASE_ENDPOINT_MICRO_ORDERS}/${this.orderId}`).subscribe({
        next: (response) => {
          if (response.success) {
            const order = response.data;
            // Verificar pertenencia (o si es admin/driver)
            const isOwner = order.userId === userData.user.id;
            const isAdmin = userData.user.role === 'ADMIN';
            const isDriver = userData.user.role === 'DRIVER';

            if (isOwner || isAdmin || isDriver) {
              this.isVerified = true;
              // Esperar a que el *ngIf renderice el mapa
              setTimeout(() => {
                if (this.mapElement) this.initMap();
              }, 100);
              
              // AUTO-PROCESS: Si ya tiene dirección y no ha sido enviada en esta sesión
              if (order.address && !this.addressSent) {
                this.address = order.address;
                
                if (order.status === 'EN_CAMINO' || order.status === 'PREPARING') {
                  this.addressSent = true;
                  this.status = order.status === 'PREPARING' ? 'Preparando pedido...' : 'Repartidor en camino...';
                  this.waitForMapInitialization().then(() => {
                    this.loadDestination();
                    this.connectWebSocket();
                  });
                } else if (order.status === 'PAGADO' || order.status === 'CREATED') {
                   // Si tiene dirección pero no ha iniciado, lo iniciamos automáticamente
                   setTimeout(() => this.sendAddress(), 1000);
                }
              }
            }
          }
        }
      });
    }
  }

  get currentUserRole() {
    return this.usersService.userData()?.user?.role;
  }

  goBack() {
    const role = this.currentUserRole;
    if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
    else if (role === 'DRIVER') this.router.navigate(['/drivers/dashboard']);
    else this.router.navigate(['/customer/deliverys']);
  }

  verifyGuest() {
    if (!this.emailInput.trim()) return;
    this.verifying = true;
    this.http.get<any>(`${BASE_ENDPOINT_MICRO_ORDERS}/${this.orderId}/verify?email=${this.emailInput}`).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.isVerified = true;
          const order = resp.data;
          
          // Inicializar datos de la orden
          if (order.address) {
             this.address = order.address;
             // Si ya está en camino, activar inmediatamente
             if (order.status === 'EN_CAMINO' || order.status === 'PREPARING') {
                this.addressSent = true;
                this.status = order.status === 'PREPARING' ? 'Preparando pedido...' : 'Repartidor en camino...';
             } else if (order.status === 'PAGADO' || order.status === 'CREATED') {
                // Si aún no inicia, intentar enviar dirección para asegurar flujo
                 setTimeout(() => this.sendAddress(), 1000);
             }
          }

          // Inicializar mapa y tracking
          setTimeout(() => {
             this.initMap();
             this.waitForMapInitialization().then(() => {
                this.loadDestination();
                this.connectWebSocket();
             });
          }, 100);

        } else {
          alert(resp.message);
        }
        this.verifying = false;
      },
      error: (err) => {
        alert("Email incorrecto o pedido no encontrado");
        this.verifying = false;
      }
    });
  }

  ngAfterViewInit() {
    if (this.isVerified) {
      this.initMap();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.ws$?.complete();
  }

  initMap() {
    if (!this.mapElement?.nativeElement) {
      console.error('Map element not found');
      return;
    }

    try {
      // Configurar icono por defecto
      L.Marker.prototype.options.icon = this.iconDefault;
      
      // Inicializar mapa
      this.map = L.map(this.mapElement.nativeElement).setView([19.4326, -99.1332], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      // Inicializar marcador del repartidor
      this.driverMarker = L.marker([19.4326, -99.1332], {
        icon: L.icon({
          iconUrl: '/assets/images/delivery-truck.png',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(this.map).bindPopup('Repartidor').openPopup();

      // Inicializar polyline de ruta (vacío por ahora)
      this.routeLine = L.polyline([], {
        color: '#007bff',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(this.map);

      this.mapInitialized = true;
      console.log('🗺️ Mapa inicializado correctamente para orderId:', this.orderId);

      // Forzar actualización del tamaño
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error inicializando mapa:', error);
      this.mapInitialized = false;
    }
  }

  sendAddress() {
    if (!this.address.trim()) return;

    this.loading = true;
    this.status = 'Enviando dirección...';

    this.http.post(
      `${BASE_ENDPOINT_MICRO_DELIVERY}/${this.orderId}/address`,
      { address: this.address },
      { responseType: 'text' }
    ).subscribe({
      next: (response: string) => {
        console.log('✅ Respuesta del servidor:', response);
        this.loading = false;
        this.addressSent = true;
        this.status = 'Repartidor en camino...';
        
        // Esperar a que el mapa esté listo antes de continuar
        this.waitForMapInitialization().then(() => {
          this.loadDestination();
          this.connectWebSocket();
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Error:', err);
        alert('Error: ' + (err.error || err.message));
        this.status = 'Error al enviar dirección';
      }
    });
  }

  private waitForMapInitialization(): Promise<void> {
    return new Promise((resolve) => {
      const checkMap = () => {
        if (this.mapInitialized && this.map) {
          resolve();
        } else {
          console.log('⏳ Esperando inicialización del mapa...');
          setTimeout(checkMap, 100);
        }
      };
      checkMap();
    });
  }

  loadDestination() {
    if (!this.mapInitialized || !this.map) {
      console.error('❌ Mapa no inicializado para cargar destino');
      return;
    }

    this.http.get<Tracking>(`${BASE_ENDPOINT_MICRO_TRACKING}/${this.orderId}/latest`)
      .subscribe({
        next: (data) => {
          console.log('🎯 Datos del destino:', data);
          
          if (data && data.deliveryLat && data.deliveryLng) {
            this.setupDestination(data.deliveryLat, data.deliveryLng);
          } else {
            console.warn('⚠️ No hay coordenadas de destino disponibles');
          }
        },
        error: (err) => {
          console.error('❌ Error cargando destino:', err);
        }
      });
  }

  private setupDestination(lat: number, lng: number) {
    if (!this.map || !this.driverMarker) {
      console.error('❌ Mapa o driverMarker no inicializados en setupDestination');
      return;
    }

    try {
      const dest = L.latLng(lat, lng);
      
      // Remover marcador de destino anterior si existe
      if (this.destinationMarker) {
        this.map.removeLayer(this.destinationMarker);
      }

      // Crear nuevo marcador de destino
      this.destinationMarker = L.marker(dest, {
        icon: this.iconDefault
      }).addTo(this.map).bindPopup('Destino').openPopup();

      // Limpiar ruta anterior
      this.routeLine.setLatLngs([]);

      // Ajustar vista del mapa
      const driverLatLng = this.driverMarker.getLatLng();
      this.map.fitBounds(L.latLngBounds([driverLatLng, dest]));

      // Forzar actualización del tamaño después del fitBounds
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      console.log('📍 Destino configurado correctamente:', dest);

    } catch (error) {
      console.error('❌ Error en setupDestination:', error);
    }
  }

  connectWebSocket() {
    if (!this.mapInitialized || !this.driverMarker) {
      console.error('❌ Mapa no inicializado para WebSocket');
      // Reintentar después de un tiempo
      setTimeout(() => this.connectWebSocket(), 500);
      return;
    }

    console.log('🔌 Conectando WebSocket para orderId:', this.orderId);

    this.ws$ = webSocket(`${WS_TRACKING}?orderId=${this.orderId}`);

    this.ws$.pipe(
      takeUntil(this.destroy$),
      filter(data => {
        // Filtrar solo datos válidos y del orderId correcto
        const isValid = !!data && data.lat && data.lng;
        if (isValid && data.orderId !== this.orderId) {
          console.warn('📭 Mensaje ignorado - OrderId incorrecto:', data.orderId, 'esperado:', this.orderId);
          return false;
        }
        return isValid;
      })
    ).subscribe({
      next: (data: Tracking) => {
        console.log('📨 Mensaje WebSocket recibido para orderId:', data.orderId, 'Estado:', data.status);
        this.updateDriverPosition(data);
      },
      error: (err) => {
        console.error('❌ WebSocket error:', err);
        // Reconectar después de 5 segundos
        setTimeout(() => this.connectWebSocket(), 5000);
      },
      complete: () => {
        console.log('🔌 WebSocket cerrado');
      }
    });
  }

  private updateDriverPosition(data: Tracking) {
    if (!this.driverMarker || !this.routeLine) {
      console.error('❌ Elementos del mapa no inicializados en updateDriverPosition');
      return;
    }

    try {
      const latlng = L.latLng(data.lat, data.lng);
      
      console.log('📍 Actualizando posición - Estado:', data.status, 'Posición:', data.lat, data.lng);

      // Actualizar posición del repartidor
      this.driverMarker.setLatLng(latlng);
      
      // Actualizar ruta
      const currentPoints = this.routeLine.getLatLngs() as L.LatLng[];
      currentPoints.push(latlng);
      this.routeLine.setLatLngs(currentPoints);

      // Calcular distancia si hay destino
      if (this.destinationMarker) {
        const destLatLng = this.destinationMarker.getLatLng();
        this.distance = this.map.distance(latlng, destLatLng) / 1000;
        console.log('📏 Distancia calculada:', this.distance?.toFixed(4), 'km');
      }

      // Actualizar estado
      if (data.status === 'ENTREGADO') {
        this.status = '¡Entregado! 🎉';
        
        // Cambiar icono del destino cuando se entregue
        if (this.destinationMarker) {
          const deliveredIcon = L.icon({
            iconUrl: '/assets/images/marker-shadow.png',
            iconSize: [41, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          this.destinationMarker.setIcon(deliveredIcon);
          this.destinationMarker.bindPopup('<b>¡Entregado! 🎉</b>').openPopup();
        }
        
        this.driverMarker.bindPopup('<b>¡Pedido Entregado! 🎉</b>').openPopup();
        console.log('✅ PEDIDO ENTREGADO - Cerrando WebSocket');
        
        // Cerrar WebSocket después de entregado
        setTimeout(() => {
          this.ws$?.complete();
        }, 2000);
        
        // Mostrar mensaje de éxito
        setTimeout(() => {
          alert('¡Pedido entregado exitosamente! 🎉');
        }, 1000);
      } else {
        this.status = `En camino... (${this.distance?.toFixed(2)} km)`;
      }

      // Centrar mapa en la nueva posición
      this.map.panTo(latlng);

    } catch (error) {
      console.error('❌ Error actualizando posición:', error);
    }
  }

  // Método para reiniciar el tracking (opcional)
  resetTracking() {
    this.address = '';
    this.addressSent = false;
    this.status = 'Esperando dirección...';
    this.distance = null;
    this.ws$?.complete();
    
    // Resetear marcadores
    if (this.driverMarker) {
      this.driverMarker.setLatLng([19.4326, -99.1332]);
      this.driverMarker.bindPopup('Repartidor').openPopup();
    }
    
    if (this.routeLine) {
      this.routeLine.setLatLngs([]);
    }
    
    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
    }
  }
}

