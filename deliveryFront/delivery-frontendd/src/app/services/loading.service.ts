import { Injectable, computed, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Signal para el estado de loading manual
  private loadingSignal = signal<boolean>(false);
  
 // Signal para el contador de peticiones HTTP activas
  private activeRequestsSignal = signal<number>(0);
  
   // Computed signal que combina ambos estados
  public loading = computed(() => 
    this.loadingSignal() || this.activeRequestsSignal() > 0
  );

  /**
   * Muestra el spinner manualmente
   */
  show() {
    this.loadingSignal.set(true);
  }

  /**
   * Oculta el spinner manualmente con un pequeño delay
   */
  hide() {
    // Pequeño delay para que se vea el spinner aunque la navegación sea rápida
    setTimeout(() => this.loadingSignal.set(false), 300);
  }

  /**
   * Incrementa el contador de peticiones activas
   * Usado por el interceptor HTTP
   */
  incrementRequests() {
    this.activeRequestsSignal.update(count => count + 1);
  }

  /**
   * Decrementa el contador de peticiones activas y oculta el spinner si no hay más
   * Usado por el interceptor HTTP
   */
  decrementRequests() {
    this.activeRequestsSignal.update(count => {
      const newCount = Math.max(0, count - 1);
      
      // Si no hay más peticiones, resetear después de un delay
      if (newCount === 0) {
        setTimeout(() => {
          if (this.activeRequestsSignal() === 0) {
            this.loadingSignal.set(false);
          }
        }, 300);
      }
      
      return newCount;
    });
  }

  /**
   * Resetea el contador (útil en caso de errores)
   */
  reset() {
    this.activeRequestsSignal.set(0);
    this.loadingSignal.set(false);
  }
}