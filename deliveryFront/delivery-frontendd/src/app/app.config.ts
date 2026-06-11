import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi
} from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthInterceptor } from './utils/interceptor/AuthInterceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';
import { KeycloakService } from './services/keycloak.service';

/**
 * Factory para APP_INITIALIZER.
 * Inicializa Keycloak antes de que Angular renderice la aplicación.
 * Esto garantiza que el token esté disponible desde el primer ciclo.
 */
function initializeKeycloak(keycloakService: KeycloakService) {
  return () => keycloakService.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([loadingInterceptor]),
      withInterceptorsFromDi()
    ),
    provideAnimationsAsync(),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    MessageService,
    ConfirmationService,
    ReactiveFormsModule,
    FormsModule,
    // Interceptor de autenticación (adjunta Bearer token de Keycloak)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    // Inicializar Keycloak antes de arrancar la aplicación
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [KeycloakService],
      multi: true
    }
  ]
};
