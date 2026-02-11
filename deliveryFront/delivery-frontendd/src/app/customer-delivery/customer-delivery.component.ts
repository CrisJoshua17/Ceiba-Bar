import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { RatingModule } from 'primeng/rating';
import { NavbarCustomerComponent } from '../navbar-customer/navbar-customer.component';
import { UsersService } from '../services/users.service';
import { DeliveryDto, OrderDto, UserInfo, UserRole } from '../model/Dtos';
import { OrdersService } from '../services/orders.service';
import { MessagesService } from '../services/messages.service';
import { DriversService } from '../services/drivers.service';
import { DeliveriesService } from '../services/deliveries.service';
import { RatingService } from '../services/rating.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-delivery',
   imports: [NavbarCustomerComponent,
    CardModule,
    TabsModule,
    TableModule,
    ToastModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    AvatarModule,
    ConfirmDialogModule,
    TooltipModule,
    DialogModule,
    SelectModule,
    RatingModule],
  templateUrl: './customer-delivery.component.html',
  styleUrl: './customer-delivery.component.scss'
})
export class CustomerDeliveryComponent {

 private ordersService = inject(OrdersService);
  private messageService = inject(MessagesService);
  private driversService = inject(DriversService);
  private deliveriesService = inject(DeliveriesService);
  private usersService = inject(UsersService);
  private cdr = inject(ChangeDetectorRef);
  private ratingService = inject(RatingService);
  private router = inject(Router);

  // Signals para búsqueda
  searchTerm = signal('');

  // Signals para datos por estado (Changed type to OrderDto)
  ordersCreated = signal<OrderDto[]>([]);
  ordersProcessing = signal<OrderDto[]>([]);
  ordersDelivered = signal<OrderDto[]>([]);
  ordersCancelled = signal<OrderDto[]>([]);
  allOrders = signal<OrderDto[]>([]);


  isLoading = signal(false);

  // Computed filters para cada señal
  filteredAll = computed(() => this.filterOrders(this.allOrders(), this.searchTerm()));
  filteredCreated = computed(() => this.filterOrders(this.ordersCreated(), this.searchTerm()));
  filteredProcessing = computed(() => this.filterOrders(this.ordersProcessing(), this.searchTerm()));
  filteredDelivered = computed(() => this.filterOrders(this.ordersDelivered(), this.searchTerm()));
  filteredCancelled = computed(() => this.filterOrders(this.ordersCancelled(), this.searchTerm()));
  
  visible = false;
  selectedOrder: OrderDto | null = null;

  // Rating modal
  ratingDialogVisible = false;
  orderToRate: OrderDto | null = null;
  currentRating: number = 0;
  currentFeedback: string = '';


  ngOnInit(): void {
    this.refreshAllTabs();
  }

  private filterOrders(orders: OrderDto[], term: string): OrderDto[] {
    const s = term.toLowerCase().trim();
    if (!s) return orders;

    return orders.filter(o => 
      o.id?.toString().includes(s))
  }

  refreshAllTabs() {
    // 1. Obtener ID del usuario logueado (Cliente)
    const userId = this.usersService.userData()?.user?.id;
    if (!userId) {
        this.messageService.error("Error", "No se identificó al usuario actual.");
        return;
    }

    this.isLoading.set(true);

    // 2. Consumir el nuevo endpoint de órdenes por usuario
    this.ordersService.getOrdersByUserId(userId).subscribe({
      next: (resp) => {
        if (resp.success) {
            // Aseguramos que data es un array, o array vacío si es null
            const orders = (resp.data || []) as OrderDto[];
            
            this.allOrders.set(orders);
            
            // 3. Filtrar localmente por estado
            // Nota: Verifica si los estados que vienen del backend coinciden exactamente (CREATED, EN_CAMINO, etc.)
            this.ordersProcessing.set(orders.filter(o => o.status === 'EN_CAMINO'));
            this.ordersDelivered.set(orders.filter(o => o.status === 'ENTREGADO'));
            this.ordersCancelled.set(orders.filter(o => o.status === 'CANCELADO'));
            // CREATED incluye también PAGADO si tu lógica lo requiere
            this.ordersCreated.set(orders.filter(o => o.status === 'CREATED' || o.status === 'PAGADO'));
        } else {
             this.messageService.error("Atención", resp.message);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        const backendMsg = err.error?.message;
        this.messageService.error("Error", backendMsg || "Error al cargar las órdenes.");
        this.isLoading.set(false);
      }
    });
  }

  loadOrdersByStatus(status: string, targetSignal: WritableSignal<OrderDto[]>) {
  }

  updateStatus(order: OrderDto, newStatus: string) {
    if (!order.id) return;

    this.isLoading.set(true);
    
    // Create a copy of the order with the new status (if needed regarding the object structure)
    // For now we just call updateOrderStatus which expects type OrderDto
    const updatedOrder = { ...order, status: newStatus };

    this.ordersService.updateOrderStatus(order.id, updatedOrder).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.messageService.success("Actualizado", `Pedido actualizado a ${newStatus}`);
          this.refreshAllTabs(); 
          this.visible = false;
        } else {
          this.messageService.error("Error", resp.message || "No se pudo actualizar.");
        }
        this.isLoading.set(false);
      },
      error: () => {
          this.messageService.error("Error", "Error al conectar con el servidor.");
          this.isLoading.set(false);
      }
    });
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'CREATED': case 'PAGADO': return 'status-created';
      case 'EN_CAMINO': return 'status-processing';
      case 'ENTREGADO': return 'status-delivered';
      case 'CANCELADO': return 'status-cancelled';
      default: return '';
    }
  }

  showDialog(order: OrderDto) {
      this.selectedOrder = order;
      this.visible = true;
   }

  // ========== RATING METHODS ==========
  openRatingDialog(order: OrderDto) {
    this.orderToRate = order;
    this.currentRating = 0;
    this.currentFeedback = '';
    this.ratingDialogVisible = true;
  }

  submitRating() {
    if (!this.orderToRate?.id || this.currentRating === 0) {
      this.messageService.error("Error", "Por favor selecciona una calificación");
      return;
    }

    this.isLoading.set(true);

    this.ratingService.rateOrder(this.orderToRate.id, {
      rating: this.currentRating,
      feedback: this.currentFeedback
    }).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.messageService.success("¡Gracias!", "Tu calificación ha sido registrada");
          this.ratingDialogVisible = false;
          this.refreshAllTabs();
        } else {
          this.messageService.error("Error", resp.message);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.messageService.error("Error", err.error?.message || "Error al enviar la calificación");
        this.isLoading.set(false);
      }
    });
  }

  viewOnMap(order: OrderDto) {
    if (order.id) {
      this.router.navigate(['/map', order.id]);
    }
  }

}

