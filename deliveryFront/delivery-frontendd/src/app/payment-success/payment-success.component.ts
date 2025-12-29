
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentsService } from '../services/payments.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      if (sessionId) {
        this.validatePayment(sessionId);
      } else {
        this.loading = false;
        this.error = true;
        this.message = 'No se encontró el ID de sesión de pago.';
      }
    });
  }

  validatePayment(sessionId: string) {
    this.paymentsService.validatePayment(sessionId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.success = true;
          this.orderId = response.data;
          this.message = response.message;
          this.cartService.clearCart();

        } else {
          this.error = true;
          this.message = response.message || 'Error validando el pago.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.message = 'Error de comunicación al validar el pago. ' + (err.error?.message || err.message);
      }
    });
  }
}
