import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, signal } from '@angular/core';
import { BASE_ENDPOINT_MICRO_AUTH, BASE_ENDPOINT_MICRO_ORDERS } from '../utils/enviroments/enviroment';
import { ApiResponseAll, OrderDto } from '../model/Dtos';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

 constructor(private http:HttpClient) { }

public baseEndpointAuth =BASE_ENDPOINT_MICRO_AUTH;
public baseEndpointOrders =BASE_ENDPOINT_MICRO_ORDERS;

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

}
