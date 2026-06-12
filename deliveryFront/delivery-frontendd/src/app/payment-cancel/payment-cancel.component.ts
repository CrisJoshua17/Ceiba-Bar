import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  templateUrl: './payment-cancel.component.html',
  styleUrls: ['./payment-cancel.component.scss']
})
export class PaymentCancelComponent {

}
