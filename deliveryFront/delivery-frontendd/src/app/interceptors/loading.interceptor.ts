import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * Interceptor HTTP que muestra/oculta el spinner automáticamente
 * para todas las peticiones HTTP
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Incrementar contador de peticiones activas
  loadingService.incrementRequests();
  
  return next(req).pipe(
    finalize(() => {
      // Decrementar contador cuando la petición termine (éxito o error)
      loadingService.decrementRequests();
    })
  );
};
