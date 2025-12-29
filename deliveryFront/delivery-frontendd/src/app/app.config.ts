import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi} from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthInterceptor } from './utils/interceptor/AuthInterceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';



export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),provideHttpClient(
    withInterceptors([loadingInterceptor]),
    withInterceptorsFromDi()),
    
    provideAnimationsAsync(),provideAnimations(),
        providePrimeNG({ 
           theme: {
                preset: Aura
            }
            }),
          provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
      MessageService,
      ConfirmationService,
      ReactiveFormsModule,
      FormsModule,
      {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
    ]
};
