import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentsService } from '../services/payments.service';
import { CartService } from '../services/cart.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private paymentsService = inject(PaymentsService);
  private cartService = inject(CartService);


  loading = true;
  success = false;
  error = false;
  orderId: string | null = null;
  message: string = '';
  paymentMethod: 'stripe' | 'paypal' = 'stripe';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log('[PaymentSuccess] URL Query Params received:', params);
      const sessionId = params['session_id'];
      const paypalToken = params['token'];
      this.paymentMethod = params['method'] || (sessionId ? 'stripe' : 'paypal');
      
      console.log('[PaymentSuccess] Extracted method:', this.paymentMethod);
      console.log('[PaymentSuccess] Extracted token/session:', sessionId || paypalToken);

      if (sessionId) {
        this.validatePayment(sessionId, 'stripe');
      } else if (paypalToken) {
        this.validatePayment(paypalToken, 'paypal');
      } else {
        console.warn('[PaymentSuccess] No session_id or token found in query params');
        this.loading = false;
        this.error = true;
        this.message = 'No se encontró el ID de sesión de pago.';
      }
    });
  }

  validatePayment(id: string, method: 'stripe' | 'paypal') {
    console.log(`[PaymentSuccess] Sending validation request to backend. Method: ${method}, ID: ${id}`);
    this.paymentsService.validatePayment(id, method).subscribe({
      next: (response) => {
        console.log('[PaymentSuccess] Validation response received:', response);
        this.loading = false;
        if (response.success) {
          this.success = true;
          this.orderId = response.data;
          this.message = response.message;
          this.cartService.clearCart();
          console.log('[PaymentSuccess] Payment validated successfully, order created:', this.orderId);
        } else {
          this.error = true;
          this.message = response.message || 'Error validando el pago.';
          console.error('[PaymentSuccess] Backend returned success=false:', response.message);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.message = 'Error de comunicación al validar el pago. ' + (err.error?.message || err.message);
        console.error('[PaymentSuccess] HTTP communication error:', err);
      }
    });
  }
}
