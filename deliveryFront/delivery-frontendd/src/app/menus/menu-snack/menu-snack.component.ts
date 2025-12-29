import { ChangeDetectorRef, Component } from '@angular/core';
import { NavbarHomeComponent } from '../../utils/navbar-home/navbar-home.component';
import { ProductsService } from '../../services/products.service';
import { DataViewModule } from 'primeng/dataview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ApiResponseAll, ProductsDtoTable } from '../../model/Dtos';
import { ImagesService } from '../../services/images.service';
import { CartService } from '../../services/cart.service';
import { MessagesService } from '../../services/messages.service';
import { ToastModule } from 'primeng/toast';


@Component({
  selector: 'app-menu-snack',
  imports: [NavbarHomeComponent,DataViewModule,SelectButtonModule,FormsModule,CommonModule,TagModule,ButtonModule,ToastModule],
  templateUrl: './menu-snack.component.html',
  styleUrl: './menu-snack.component.scss'
})
export class MenuSnackComponent {

  
  layout: 'list' | 'grid' = 'grid';
  options: ('list' | 'grid')[] = ['list', 'grid'];
  isLoading: boolean = true;


  products:any;
    constructor(private productService: ProductsService, private imagesService: ImagesService,private cdr: ChangeDetectorRef,
      private cartService: CartService,private messageService: MessagesService
    ) {}

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
          this.products = response.data.filter((product:ProductsDtoTable)=>product.type === 'SNACK')
          .map((product: ProductsDtoTable) => {
            const fullImageUrl = this.getFullImageUrl(product.image);
            
            
            return {
              ...product,
              image: fullImageUrl,
              // Propiedades adicionales para compatibilidad
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
  


 // Método para agregar producto al carrito
  addToCart(product: ProductsDtoTable): void {
    this.cartService.addToCart(product);
    this.messageService.info('Compras', 'Producto agregado al carrito');
    console.log(' Producto agregado al carrito:', product.name);
  }

}
