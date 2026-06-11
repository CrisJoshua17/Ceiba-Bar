import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { ApiResponseAll, OrderDto } from '../model/Dtos';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

 constructor(private http:HttpClient) { }

public baseEndpointOrders = `${environment.apiGateway}/api/orders`;

// 1. Signal para almacenar y compartir los datos de la orden
  private orderSignal: WritableSignal<OrderDto | null> = signal<OrderDto | null>(null);
  
  // 2. Signal de solo lectura para exponer al exterior
  public orderData = this.orderSignal.asReadonly();


 findAllOrders(){
    return this.http.get<ApiResponseAll<any[]>>(`${this.baseEndpointOrders}/all`);
  }

  findAllOrdersByStatus(status: string){
    return this.http.get<ApiResponseAll<any[]>>(`${this.baseEndpointOrders}/status/${status}`);
  }

  updateOrderStatus(id: number, order: OrderDto){
    return this.http.put<ApiResponseAll<OrderDto>>(`${this.baseEndpointOrders}/${id}`, order);
  }

  getOrdersByUserId(userId: number){
    return this.http.get<ApiResponseAll<OrderDto[]>>(`${this.baseEndpointOrders}/user/${userId}`);
  }

  /**
   * Crea una orden directamente en micro-realtime.
   * Usado para flujo sin pago o para testing manual.
   */
  createOrder(order: OrderDto){
    return this.http.post<ApiResponseAll<OrderDto>>(`${this.baseEndpointOrders}`, order);
  }

}
