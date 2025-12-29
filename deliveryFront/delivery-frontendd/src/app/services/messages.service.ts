import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDeleteMessages, UserAdminDto } from '../model/Dtos';
import { UsersService } from './users.service';
import { ProductsService } from './products.service';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  constructor(private messageService: MessageService, private confirm:ConfirmationService,private userService:UsersService,
    private router: Router,
  private productService:ProductsService) {}



  success(summary: string, detail: string) {
    this.messageService.add({ severity: 'success', summary, detail });
  }

  info(summary: string, detail: string) {
    this.messageService.add({ severity: 'info', summary, detail });
  }

  warn(summary: string, detail: string) {
    this.messageService.add({ severity: 'warn', summary, detail });
  }

  error(summary: string, detail: string) {
    this.messageService.add({ severity: 'error', summary, detail });
  }



private ejecutarEliminacion(
  user: { id: number },
  messages: ConfirmDeleteMessages,
  navigateAfter: boolean,
  onSuccess?: () => void
) {
  this.userService.eliminarPerfilConFormData(user.id).subscribe({
    next: (response) => {
      if (response.success) {
        this.success(messages.summary, messages.detail);

        if (navigateAfter) {
          setTimeout(() => this.router.navigate(['']), 2500);
        }
         if (onSuccess) {
          onSuccess();
        }
      } else {
        this.warn("Error", "Lo sentimos por el momento no podemos eliminarlo");
      }
    },
    error: (err: any) => {
      if (err.status === 500) {
        this.error(messages.summaryFail, messages.detailFail);
      }
    }
  });
}

private ejecutarEliminacioProducts(
  product: { id: number },
  messages: ConfirmDeleteMessages,
  navigateAfter: boolean,
  onSuccess?: () => void
) {
  this.productService.deleteProduct(product.id).subscribe({
    next: (response) => {
      if (response.success) {
        this.success(messages.summary, messages.detail);

        if (navigateAfter) {
          setTimeout(() => this.router.navigate(['']), 2500);
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        this.warn("Error", "Lo sentimos por el momento no podemos eliminarlo");
      }
    },
    error: (err: any) => {
      if (err.status === 500) {
        this.error(messages.summaryFail, messages.detailFail);
      }
    }
  });
}



private mostrarConfirmacion(
  event: Event,
  messages: ConfirmDeleteMessages,
  onAccept: () => void
) {
  this.confirm.confirm({
    target: event.target as EventTarget,
    message: messages.mensaje,
    header: "Confirmación",
    closable: true,
    closeOnEscape: true,
    icon: "pi pi-exclamation-triangle",
    rejectButtonProps: {
      label: "Cancelar",
      severity: "secondary",
      outlined: true,
    },
    acceptButtonProps: {
      label: "Eliminar",
    },
    accept: onAccept,
    reject: () => {
      this.error(messages.summaryReject, messages.detailReject);
    }
  });
}






confirmDelete(event: Event, messages: ConfirmDeleteMessages, user: { id: number }) {
  this.mostrarConfirmacion(event, messages, () => {
    this.ejecutarEliminacion(user, messages, true);
  });
}

confirmDeleteUsers(event: Event, messages: ConfirmDeleteMessages, user: { id: number }, onSuccess?: () => void) {
  this.mostrarConfirmacion(event, messages, () => {
    this.ejecutarEliminacion(user, messages, false, onSuccess);
  });
}

confirmDeleteProducts(event: Event, messages: ConfirmDeleteMessages, product: { id: number }, onSuccess?: () => void) {
  this.mostrarConfirmacion(event, messages, () => {
    this.ejecutarEliminacioProducts(product, messages, false, onSuccess);
  });
}
///////Los callbacks se usan para un refresh de las entidades para que se reconozca y se actualicen los signals

}
