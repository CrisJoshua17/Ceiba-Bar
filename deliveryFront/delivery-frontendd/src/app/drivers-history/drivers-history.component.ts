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
import { DeliveryDto } from '../model/Dtos';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { DeliveriesService } from '../services/deliveries.service';
import { DriversService } from '../services/drivers.service';
import { MessagesService } from '../services/messages.service';
import { OrdersService } from '../services/orders.service';
import { UsersService } from '../services/users.service';
import { NavbarDriverComponent } from '../navbar-driver/navbar-driver.component';

@Component({
  selector: 'app-drivers-history',
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
  templateUrl: './drivers-history.component.html',
  styleUrl: './drivers-history.component.scss'
})
export class DriversHistoryComponent {
 private ordersService = inject(OrdersService);
  private messageService = inject(MessagesService);
  private driversService = inject(DriversService);
  private deliveriesService = inject(DeliveriesService);
  private usersService = inject(UsersService); // Inject UsersService
  private cdr = inject(ChangeDetectorRef);

  // Signals para búsqueda
  searchTerm = signal('');

  // Signals para datos por estado (Changed type to DeliveryDto)
  ordersDelivered = signal<DeliveryDto[]>([]);
  allOrders = signal<DeliveryDto[]>([]);


  isLoading = signal(false);

  // Computed filters para cada señal
  filteredAll = computed(() => this.filterOrders(this.allOrders(), this.searchTerm()));
  filteredDelivered = computed(() => this.filterOrders(this.ordersDelivered(), this.searchTerm()));
  
  visible = false;
  selectedOrder: DeliveryDto | null = null;


  ngOnInit(): void {
    this.refreshAllTabs();
  }

  private filterOrders(orders: DeliveryDto[], term: string): DeliveryDto[] {
    const s = term.toLowerCase().trim();
    if (!s) return orders;

    return orders.filter(o => 
      o.orderId?.toString().includes(s) 
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
            this.ordersDelivered.set(deliveries.filter(d => d.status === 'ENTREGADO'));
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
