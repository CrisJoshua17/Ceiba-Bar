import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { KeycloakService } from '../../services/keycloak.service';

/**
 * Interceptor HTTP que adjunta el Bearer token de Keycloak
 * a todas las peticiones salientes.
 *
 * Antes de adjuntar el token, intenta refrescarlo si está
 * próximo a expirar (< 30 segundos de validez restante).
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloakService: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Evitar interceptar peticiones de validación de pago públicas
    if (req.url.includes('/api/payments/validate/')) {
      return next.handle(req);
    }

    // Si el usuario no está logueado, dejar pasar la petición sin token
    if (!this.keycloakService.isLoggedIn()) {
      return next.handle(req);
    }

    // Refrescar token si está próximo a expirar y luego adjuntarlo
    return from(this.keycloakService.refreshToken(30)).pipe(
      switchMap(() => {
        const token = this.keycloakService.getToken();
        if (token) {
          const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
          });
          return next.handle(authReq);
        }
        return next.handle(req);
      })
    );
  }
}