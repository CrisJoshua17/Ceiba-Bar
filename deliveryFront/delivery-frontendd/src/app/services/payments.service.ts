import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_ENDPOINT_MICRO_PAYMENTS } from '../utils/enviroments/enviroment';
import { ApiResponse, CheckoutRequest } from '../model/Dtos';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {

  private baseEndpoint = BASE_ENDPOINT_MICRO_PAYMENTS;

  constructor(private http: HttpClient) { }

  createCheckoutSession(checkoutRequest: CheckoutRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseEndpoint}/checkout`, checkoutRequest);
  }

  validatePayment(sessionId: string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.baseEndpoint}/validate/${sessionId}`);
  }
}
