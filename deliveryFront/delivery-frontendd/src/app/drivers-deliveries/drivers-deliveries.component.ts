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
import { NavbarDriverComponent } from '../navbar-driver/navbar-driver.component';
import { UsersService } from '../services/users.service';
import { DeliveryDto, OrderDto, UserInfo, UserRole } from '../model/Dtos';
import { OrdersService } from '../services/orders.service';
import { MessagesService } from '../services/messages.service';
import { DriversService } from '../services/drivers.service';
import { DeliveriesService } from '../services/deliveries.service';

// ... imports

@Component({
  selector: 'app-drivers-deliveries',
  imports: [NavbarDriverComponent,
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
    SelectModule],
  templateUrl: './drivers-deliveries.component.html',
  styleUrl: './drivers-deliveries.component.scss'
})
export class DriversDeliveriesComponent {

  private ordersService = inject(OrdersService);
  private messageService = inject(MessagesService);
  private driversService = inject(DriversService);
  private deliveriesService = inject(DeliveriesService);
  private usersService = inject(UsersService); // Inject UsersService
  private cdr = inject(ChangeDetectorRef);

  // Signals para búsqueda
  searchTerm = signal('');

  // Signals para datos por estado (Changed type to DeliveryDto)
  ordersCreated = signal<DeliveryDto[]>([]);
  ordersProcessing = signal<DeliveryDto[]>([]);
  ordersDelivered = signal<DeliveryDto[]>([]);
  ordersCancelled = signal<DeliveryDto[]>([]);
  allOrders = signal<DeliveryDto[]>([]);


  isLoading = signal(false);

  // Computed filters para cada señal
  filteredAll = computed(() => this.filterOrders(this.allOrders(), this.searchTerm()));
  filteredCreated = computed(() => this.filterOrders(this.ordersCreated(), this.searchTerm()));
  filteredProcessing = computed(() => this.filterOrders(this.ordersProcessing(), this.searchTerm()));
  filteredDelivered = computed(() => this.filterOrders(this.ordersDelivered(), this.searchTerm()));
  filteredCancelled = computed(() => this.filterOrders(this.ordersCancelled(), this.searchTerm()));
  
  visible = false;
  selectedOrder: DeliveryDto | null = null;


  ngOnInit(): void {
    this.refreshAllTabs();
  }

  private filterOrders(orders: DeliveryDto[], term: string): DeliveryDto[] {
    const s = term.toLowerCase().trim();
    if (!s) return orders;

    return orders.filter(o => 
      o.orderId?.toString().includes(s) ||
      o.customerName?.toLowerCase().includes(s) ||
      o.customerEmail?.toLowerCase().includes(s) ||
      o.status?.toLowerCase().includes(s)
    );
  }

  refreshAllTabs() {
    const driverId = this.usersService.userData()?.driver?.id;
    if (!driverId) {
        this.messageService.error("Error", "No se identificó al conductor actual.");
        return;
    }

    this.isLoading.set(true);
    this.deliveriesService.getDriverDeliveries(driverId).subscribe({
      next: (resp) => {
        if (resp.success) {
            const deliveries = resp.data as DeliveryDto[];
            this.allOrders.set(deliveries);
            
            // Filter locally based on status
            this.ordersProcessing.set(deliveries.filter(d => d.status === 'EN_CAMINO'));
            this.ordersDelivered.set(deliveries.filter(d => d.status === 'ENTREGADO'));
            this.ordersCancelled.set(deliveries.filter(d => d.status === 'CANCELADO'));
            this.ordersCreated.set(deliveries.filter(d => d.status === 'CREATED' || d.status === 'PAGADO'));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.error("Error", "Error al cargar las entregas.");
        this.isLoading.set(false);
      }
    });
  }

  loadOrdersByStatus(status: string, targetSignal: WritableSignal<DeliveryDto[]>) {
  }

  updateStatus(delivery: DeliveryDto, newStatus: string) {
    if (!delivery.id) return;

    this.isLoading.set(true);
    let action$: any;

    if (newStatus === 'ENTREGADO') {
        action$ = this.deliveriesService.completeDelivery(delivery.id);
    } else if (newStatus === 'CANCELADO') {
        action$ = this.deliveriesService.cancelDelivery(delivery.id);
    } else {
        this.isLoading.set(false);
        return;
    }

    action$.subscribe({
      next: (resp: any) => {
        if (resp.success) {
          this.messageService.success("Actualizado", `Entrega actualizada a ${newStatus}`);
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





 showDialog(order: DeliveryDto) {
     this.selectedOrder = order;
     this.visible = true;
  }


 

 
 

}
