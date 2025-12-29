import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { RouterModule } from '@angular/router';
import { NavbarHomeComponent } from '../utils/navbar-home/navbar-home.component';
import { AuthService } from '../services/auth.service';
import { NavbarSimpleComponent } from '../utils/navbar-simple/navbar-simple.component';
import { ToastModule } from 'primeng/toast';
import { MessagesService } from '../services/messages.service';
import { NavigationService} from '../services/navigation-service.service';


@Component({
  selector: 'app-login-page',
  imports: [ButtonModule, ProgressSpinnerModule,CardModule,PasswordModule,FormsModule, CommonModule, MessageModule,RouterModule
    ,NavbarSimpleComponent,ToastModule 
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {

  username!: string;
   password!: string;

   loading:boolean=false;

   errorMessage = 'Usuario o Contraseña incorrectos';


   constructor(
    private authService: AuthService, 
    private mensajeService: MessagesService,
    private navigationService: NavigationService
  ) {}

  loggin(){
    this.loading= true;
     const userDto = {
      email: this.username,
      password: this.password
    };
      this.authService.login(userDto).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response.success) {
          const token = response.data;
          localStorage.setItem('token', token);
          this.mensajeService.success("Éxito", "Autenticado con éxito");
          setTimeout(() => {
          this.navigationService.redirectAfterLogin();
        }, 1500); 
          
        } else {
          this.mensajeService.error("Error",response.message);
        }
      },
      error: (error) => {
        this.loading = false;
      this.mensajeService.warn("Ups!","Estamos teniendo inconvenientes");
      }
    });
  }

}
