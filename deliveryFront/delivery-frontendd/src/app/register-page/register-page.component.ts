import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { Route, Router, RouterModule } from '@angular/router';
import { NavbarSimpleComponent } from '../utils/navbar-simple/navbar-simple.component';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { UsersService } from '../services/users.service';
import { MessagesService } from '../services/messages.service';

@Component({
  selector: 'app-register-page',
  imports: [
    ButtonModule, 
    ProgressSpinnerModule,
    CardModule,
    PasswordModule,
    ReactiveFormsModule, // Cambiado de FormsModule a ReactiveFormsModule
    CommonModule, 
    MessageModule,
    RouterModule,
    NavbarSimpleComponent,
    ToastModule,
    InputTextModule
  ],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent implements OnInit {

  registerForm!: FormGroup;
  loading: boolean = false;

  constructor(
    private userService: UsersService, 
    private mensajeService: MessagesService,
    private router: Router,
    private fb: FormBuilder // Inyectar FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.registerForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(30)
      ]],
      lastname: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(30)
      ]],
      username: ['', [
        Validators.required, 
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      phone: ['', [
        Validators.pattern('^[0-9]{10}$')
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(4), 
        Validators.maxLength(20)
      ]]
    });
  }

  register() {
    if (this.registerForm.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const userRegisterGenericDto = {
      name: this.registerForm.get('name')?.value,
      lastName: this.registerForm.get('lastname')?.value,
      email: this.registerForm.get('username')?.value,
      password: this.registerForm.get('password')?.value,
      phone: this.registerForm.get('phone')?.value
      
    };

    this.userService.registerGeneric(userRegisterGenericDto).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.mensajeService.success("Éxito", response.message);
          this.router.navigate(['/home']);
        } else {
          this.mensajeService.error("Error", response.message);
        }
      },
      error: (error) => {
        this.loading = false;
        this.mensajeService.warn("¡Ups!", "Estamos teniendo inconvenientes");
      }
    });
  }

  // Helper methods para acceder fácilmente a los controles
  get name() { return this.registerForm.get('name'); }
  get lastname() { return this.registerForm.get('lastname'); }
  get username() { return this.registerForm.get('username'); }
  get phone() { return this.registerForm.get('phone'); }
  get password() { return this.registerForm.get('password'); }
}