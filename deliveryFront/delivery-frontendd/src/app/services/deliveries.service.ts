import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssignDriverRequest, DeliveryResponse } from '../model/Dtos';
import { API_GATEWAY } from '../utils/enviroments/enviroment';


@Injectable({
  providedIn: 'root'
})
export class DeliveriesService {

  private baseEndpoint = `${API_GATEWAY}/api/delivery`;

  constructor(private http: HttpClient) { }

  /**
   * Asigna un driver a una orden
   */
  assignDriver(request: AssignDriverRequest): Observable<DeliveryResponse> {
    return this.http.post<DeliveryResponse>(`${this.baseEndpoint}/assign`, request);
  }

  /**
   * Obtiene las entregas de un driver
   */
  getDriverDeliveries(driverId: number): Observable<DeliveryResponse> {
    return this.http.get<DeliveryResponse>(`${this.baseEndpoint}/driver/${driverId}`);
  }

  /**
   * Obtiene las entregas activas de un driver
   */
  getDriverActiveDeliveries(driverId: number): Observable<DeliveryResponse> {
    return this.http.get<DeliveryResponse>(`${this.baseEndpoint}/driver/${driverId}/active`);
  }

  /**
   * Inicia una entrega
   */
  startDelivery(deliveryId: number): Observable<DeliveryResponse> {
    return this.http.put<DeliveryResponse>(`${this.baseEndpoint}/${deliveryId}/start`, {});
  }

  /**
   * Completa una entrega
   */
  completeDelivery(deliveryId: number): Observable<DeliveryResponse> {
    return this.http.put<DeliveryResponse>(`${this.baseEndpoint}/${deliveryId}/complete`, {});
  }

  /**
   * Cancela una entrega
   */
  cancelDelivery(deliveryId: number): Observable<DeliveryResponse> {
    return this.http.put<DeliveryResponse>(`${this.baseEndpoint}/${deliveryId}/cancel`, {});
  }
}
