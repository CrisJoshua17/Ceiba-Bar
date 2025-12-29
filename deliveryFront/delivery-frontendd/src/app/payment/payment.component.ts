import { Component, computed, inject } from '@angular/core';
import { NavbarCustomerComponent } from '../navbar-customer/navbar-customer.component';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CurrencyPipe } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { CartService } from '../services/cart.service';
import { CartItem, ProductsDtoTable, ProductDto, OrderDto, CheckoutRequest } from '../model/Dtos';
import { UsersService } from '../services/users.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentsService } from '../services/payments.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [ NavbarCustomerComponent,
  CardModule,
  TableModule,
  CurrencyPipe,
  PanelModule,
  ReactiveFormsModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss'
})
export class PaymentComponent {
  private cartService = inject(CartService);
  private usersService = inject(UsersService);

  user = this.usersService.userData; // Signal del usuario
private fb = inject(FormBuilder);

  cartItems = this.cartService.cartItems; // Signal de los items
  cartTotal = this.cartService.cartTotal; // Signal del total (opcional


form = this.fb.group({
  name: ['', Validators.required],
  lastName: ['', Validators.required],
  street: ['', Validators.required],
  colonia: ['', Validators.required],
  delegacion: ['', Validators.required],
  cp: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  phone: ['', Validators.required],
  notes: ['']
});



  productsCrt = computed(() => 
    this.cartItems().map(item => item.product)
  );

  getTotal(): number {
    return this.cartItems().reduce((sum, product) => sum + product.product.price * product.quantity, 0);
  }

  private paymentsService = inject(PaymentsService);

  constructor(){
  const userData = this.user();   // signal → valor

  if (userData?.user) {
    const u = userData.user;
    const address = userData.customer?.addresses?.find(address => address.isDefault);
    this.form.patchValue({
      name: u.name,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone ?? '',
      street: address?.street,
      colonia: address?.colonia,
      delegacion: address?.delegacion,
      cp: address?.postalCode,
    });

    this.form.controls['name'].disable();
    this.form.controls['lastName'].disable();
    this.form.controls['email'].disable();
    this.form.controls['phone'].disable();

  
  }

}

  payWithStripe() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValues = this.form.getRawValue(); // getRawValue para incluir los disabled
    const userData = this.user();

    // Mapear productos del carrito a ProductDto
    const productsDto: ProductDto[] = this.cartItems().map(item => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: item.product.price,
      image: item.product.image || '',
      available: item.product.available
    }));

    // Construir OrderDto
    const orderDto: OrderDto = {
      userId: userData?.user.id,
      customerName: `${formValues.name} ${formValues.lastName}`,
      customerEmail: formValues.email ?? '',
      address: `${formValues.street}, ${formValues.colonia}, ${formValues.delegacion}, ${formValues.cp}`,
      destinationLat: 0, 
      destinationLng: 0, 
      products: productsDto,
      status: 'CREATED'
    };

    // Calcular monto en centavos (Stripe usa centavos)
    const amountInCents = Math.round(this.cartTotal() * 100);

    const checkoutRequest: CheckoutRequest = {
      orderDto: orderDto,
      amount: amountInCents,
      itemProduct: `Pedido de ${formValues.name}` 
    };

    this.paymentsService.createCheckoutSession(checkoutRequest).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Redirigir a Stripe
          window.location.href = response.data;
        } else {
          console.error('Error iniciando pago:', response.message);
        }
      },
      error: (err) => {
        console.error('Error de comunicación con pagos:', err);
      }
    });
  }

}
