import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, OrderDto } from '../model/Dtos';

export interface RatingRequest {
  rating: number;
  feedback?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private http = inject(HttpClient);

  /**
   * Califica una orden entregada
   */
  rateOrder(orderId: number, ratingRequest: RatingRequest): Observable<ApiResponse<OrderDto>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse<OrderDto>>(
      `${environment.endpoints.orders}/${orderId}/rate`,
      ratingRequest,
      { headers }
    );
  }
}
