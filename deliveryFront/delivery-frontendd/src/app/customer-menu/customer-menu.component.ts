import { ChangeDetectorRef, Component, effect, signal } from '@angular/core';
import { NavbarCustomerComponent } from '../navbar-customer/navbar-customer.component';
import { ProductsDtoTable } from '../model/Dtos';
import { CartService } from '../services/cart.service';
import { ImagesService } from '../services/images.service';
import { MessagesService } from '../services/messages.service';
import { ProductsService } from '../services/products.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-customer-menu',
  imports: [
    NavbarCustomerComponent,
    DataViewModule,
    SelectButtonModule,
    FormsModule,
    CommonModule,
    TagModule,
    ButtonModule,
    ToastModule,
    TabsModule
  ],
  templateUrl: './customer-menu.component.html',
  styleUrl: './customer-menu.component.scss'
})
export class CustomerMenuComponent {

  layout: 'list' | 'grid' = 'grid';
  options: ('list' | 'grid')[] = ['list', 'grid'];
  isLoading: boolean = true;
  activeTabIndex = signal<number>(0);
  selectedCategory: string = 'all';
  products: any;

  constructor(
    private productService: ProductsService, 
    private imagesService: ImagesService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private messageService: MessagesService
  ) {
    // Effect que se ejecuta automáticamente cuando activeTabIndex cambia
    effect(() => {
    this.updateSelectedCategory();
    });
  }
  private updateSelectedCategory() {
  switch (this.activeTabIndex()) {  // Leer el signal con ()
    case 0: this.selectedCategory = 'all'; break;
    case 1: this.selectedCategory = 'drinks'; break;
    case 2: this.selectedCategory = 'snacks'; break;
    case 3: this.selectedCategory = 'recipes'; break;
    default: this.selectedCategory = 'all';
  }
}

  ngOnInit(): void {
    this.getProducts();
  }

  getSeverity(product: ProductsDtoTable) {
    switch (product.available) {
      case true:
        return 'success';
      case false:
        return 'danger';
      default:
        return null;
    }
  }

  getProducts() {
    this.productService.findAllProductsAvalible().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products = response.data
          .map((product: ProductsDtoTable) => {
            const fullImageUrl = this.getFullImageUrl(product.image);
            
            return {
              ...product,
              image: fullImageUrl,
              inventoryStatus: product.available ? 'IN STOCK' : 'OUT OF STOCK',
            };
          });
          
        } else {
          this.products = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error en la petición:', error);
        this.products = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getFullImageUrl(imagePath: string | null): string {
    return this.imagesService.getFullImageUrlProducts(imagePath);
  }

  // Método para manejar cambio de pestaña - CORREGIDO
 onTabChange(event: any) {
  this.activeTabIndex = event.value;
  this.updateSelectedCategory();
  this.cdr.detectChanges();
}

  

  // Filtrar productos según la categoría seleccionada
  getFilteredProducts(): any[] {
    if (!this.products) return [];

    switch (this.selectedCategory) {
      case 'all':
        return this.products;
      case 'drinks':
        return this.products.filter((product: any) => product.type === 'DRINK');
      case 'snacks':
        return this.products.filter((product: any) => product.type === 'SNACK');
      case 'recipes':
        return this.products.filter((product: any) => product.type === 'RECETARIO');
      default:
        return this.products;
    }
  }

  // Método para agregar producto al carrito
  addToCart(product: ProductsDtoTable): void {
    this.cartService.addToCart(product);
    this.messageService.info('Compras', 'Producto agregado al carrito');
    console.log('Producto agregado al carrito:', product.name);
  }

  // Método opcional: si quieres mostrar el tipo de bebida en la UI
  getDrinkTypeDisplay(drinkType: string | null): string {
    if (!drinkType) return '';
    
    switch (drinkType) {
      case 'ALCOHOLIC':
        return ' (Alcohólica)';
      case 'NON_ALCOHOLIC':
        return ' (No Alcohólica)';
      default:
        return '';
    }
  }
}