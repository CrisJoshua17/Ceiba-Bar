import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, signal, computed, WritableSignal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { OrderDto, UserData, UserInfo, UserRole } from '../model/Dtos';
import { MessagesService } from '../services/messages.service';
import { OrdersService } from '../services/orders.service';

import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DriversService } from '../services/drivers.service';
import { DeliveriesService } from '../services/deliveries.service';

@Component({
  selector: 'app-pedidos-admin',
  standalone: true,
  imports: [
    NavbarAdminComponent,
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
  ],
  templateUrl: './pedidos-admin.component.html',
  styleUrl: './pedidos-admin.component.scss'
})
export class PedidosAdminComponent implements OnInit {

  private ordersService = inject(OrdersService);
  private messageService = inject(MessagesService);
  private driversService = inject(DriversService);
  private deliveriesService = inject(DeliveriesService);
  private cdr = inject(ChangeDetectorRef);

  // Signals para búsqueda
  searchTerm = signal('');

  // Signals para datos por estado
  ordersCreated = signal<OrderDto[]>([]);
  ordersProcessing = signal<OrderDto[]>([]);
  ordersDelivered = signal<OrderDto[]>([]);
  ordersCancelled = signal<OrderDto[]>([]);
  allOrders = signal<OrderDto[]>([]);


  drivers :UserInfo[] = [];
  driversData =this.driversService.driversData;

    selectDriver: UserInfo | null = null;
    
  isLoading = signal(false);

  // Computed filters para cada señal
  filteredAll = computed(() => this.filterOrders(this.allOrders(), this.searchTerm()));
  filteredCreated = computed(() => this.filterOrders(this.ordersCreated(), this.searchTerm()));
  filteredProcessing = computed(() => this.filterOrders(this.ordersProcessing(), this.searchTerm()));
  filteredDelivered = computed(() => this.filterOrders(this.ordersDelivered(), this.searchTerm()));
  filteredCancelled = computed(() => this.filterOrders(this.ordersCancelled(), this.searchTerm()));
  
  visible = false;
  selectedOrder: OrderDto | null = null;


  ngOnInit(): void {
    this.refreshAllTabs();
    this.getDrivers();

  }

  private filterOrders(orders: OrderDto[], term: string): OrderDto[] {
    const s = term.toLowerCase().trim();
    if (!s) return orders;

    return orders.filter(o => 
      o.id?.toString().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.customerEmail.toLowerCase().includes(s) ||
      o.status?.toLowerCase().includes(s)
    );
  }

  refreshAllTabs() {
    this.loadOrdersByStatus('CREATED', this.ordersCreated);
    this.loadOrdersByStatus('EN_CAMINO', this.ordersProcessing);
    this.loadOrdersByStatus('ENTREGADO', this.ordersDelivered);
    this.loadOrdersByStatus('CANCELADO', this.ordersCancelled);
    
    // Para la pestaña "Todos" seguimos usando findAllOrders
    this.ordersService.findAllOrders().subscribe({
      next: (resp) => {
        if (resp.success) this.allOrders.set(resp.data);
      }
    });
  }

  loadOrdersByStatus(status: string, targetSignal: WritableSignal<OrderDto[]>) {
    this.isLoading.set(true);
    this.ordersService.findAllOrdersByStatus(status).subscribe({
      next: (response) => {
        if (response.success) {
          targetSignal.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.error("Error", `No se pudieron obtener pedidos ${status}`);
        this.isLoading.set(false);
      }
    });
  }




  updateStatus(order: OrderDto, newStatus: string) {
    if (!order.id) return;

    const updatedOrder = { ...order, status: newStatus };
    this.ordersService.updateOrderStatus(order.id, updatedOrder).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.messageService.success("Actualizado", `El pedido #${order.id} ahora está ${newStatus}`);
          this.refreshAllTabs(); // Refrescamos todo para mover el item entre señales
        } else {
          this.messageService.error("Error", resp.message || "No se pudo actualizar el estado.");
        }
      },
      error: () => this.messageService.error("Error", "Error al conectar con el servidor.")
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


  confirmInRoad(order: OrderDto, newStatus: string){
    this.selectedOrder = order;
    this.showDialog();
  }


 showDialog() {
     this.visible = true;
     
  }


  getDrivers(){
    this.driversService.getAllDrivers(UserRole.DRIVER).subscribe({
      next: (resp) => {
        if (resp.success) this.messageService.success("Exito", "Se obtuvieron los conductores");
      },error: () => {
        this.messageService.error("Error", "Error al conectar con el servidor.");
      }
    });
  }

  assignDriver() {
    if (!this.selectedOrder || !this.selectDriver) {
      this.messageService.error("Error", "Debe seleccionar un conductor");
      return;
    }

    const request = {
      orderId: this.selectedOrder.id!,
      driverId: this.selectDriver.id,
      notes: `Asignado desde panel admin`
    };

    this.deliveriesService.assignDriver(request).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.messageService.success("Éxito", `Driver asignado correctamente a la orden #${this.selectedOrder?.id}`);
          this.visible = false;
          this.selectDriver = null;
          this.selectedOrder = null;
          this.refreshAllTabs();
        } else {
          this.messageService.error("Error", resp.message || "No se pudo asignar el driver");
        }
      },
      error: (err) => {
        this.messageService.error("Error", "Error al conectar con el servidor");
        console.error('Error asignando driver:', err);
      }
    });
  }

}
