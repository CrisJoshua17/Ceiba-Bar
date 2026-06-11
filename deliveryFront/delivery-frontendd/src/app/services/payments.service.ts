import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, CheckoutRequest } from '../model/Dtos';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {

  private baseEndpoint = `${environment.apiGateway}/api/payments`;

  constructor(private http: HttpClient) { }

  /**
   * Crea una sesión de pago (Stripe Checkout o PayPal Order).
   * El backend redirige al usuario a la pasarela de pago.
   */
  createCheckoutSession(checkoutRequest: CheckoutRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseEndpoint}/checkout`, checkoutRequest);
  }

  /**
   * Valida el resultado de un pago tras el redirect de la pasarela.
   * @param identifier - session_id de Stripe o order_id de PayPal
   * @param method     - 'stripe' | 'paypal' (default: 'stripe')
   */
  validatePayment(
    identifier: string,
    method: 'stripe' | 'paypal' = 'stripe'
  ): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseEndpoint}/validate/${method}/${identifier}`
    );
  }
}
