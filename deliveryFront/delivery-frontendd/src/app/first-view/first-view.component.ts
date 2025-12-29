import { NavbarHomeComponent } from "../utils/navbar-home/navbar-home.component";
import { GalleriaModule } from 'primeng/galleria';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { Component, AfterViewInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { SwiperContainer } from 'swiper/element';
import { SwiperOptions } from 'swiper/types';
import { register } from 'swiper/element/bundle';
import { Texts } from "../utils/Text/text";
import * as AOS from 'aos';
import { ImagesService } from "../services/images.service";
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from "primeng/button";
import { ProductsService } from "../services/products.service";
import { ProductsDtoTable } from "../model/Dtos";
import { BASE_PATH_IMAGES_PRODUCTS } from "../utils/enviroments/enviroment";
import { CartService } from "../services/cart.service";
import { ToastModule } from "primeng/toast";
import { MessagesService } from "../services/messages.service";


@Component({
  selector: 'app-first-view',
  imports: [NavbarHomeComponent,CommonModule,GalleriaModule,DialogModule,CarouselModule,ButtonModule,ToastModule  ],
  templateUrl: './first-view.component.html',
  styleUrl: './first-view.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA] ,
})
export class FirstViewComponent {
@ViewChild('swiper') swiperRef!: ElementRef;

activeIndexGalleria: number = 0;
isLoading: boolean = true;

  images: any = [];
  imagesHistory: any = [];
   products: ProductsDtoTable[] = [];


  // Variables para el modal
  displayModal: boolean = false;
  activeIndex: number = 0;

  responsiveOptions: any[] = [
    { breakpoint: '1024px', numVisible: 6 },
    { breakpoint: '768px', numVisible: 3 },
    { breakpoint: '560px', numVisible: 1 }
  ];


  carouselResponsiveOptions: any[] = [
  { breakpoint: '1400px', numVisible: 5, numScroll: 1 },
  { breakpoint: '1200px', numVisible: 4, numScroll: 1 },
  { breakpoint: '992px', numVisible: 3, numScroll: 1 },
  { breakpoint: '768px', numVisible: 2, numScroll: 1 },
  { breakpoint: '576px', numVisible: 1, numScroll: 1 }
];

  texts = Texts;

  
constructor(private imagesService: ImagesService, private cdr:ChangeDetectorRef, 
  private productService: ProductsService, private cartService: CartService, private messageService: MessagesService) {}


  ngOnInit() {
    this.images = this.imagesService.getGalleryImages();
    this.imagesHistory = this.imagesService.getHistoryImages();
    this.loadAvailableProducts();
  }


   loadAvailableProducts() {
    this.isLoading = true;
    this.productService.findAllProductsAvalible().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo productos disponibles y mapear al formato necesario
          this.products = response.data
            .filter((product: ProductsDtoTable) => product.available)
            .map((product: ProductsDtoTable) => ({
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              available: product.available,
              image: this.getFullImageUrl(product.image), // Asegurar URL completa
              type: product.type,
              drinkType: product.drinkType,
              // Propiedades para el carousel (compatibilidad)
              category: this.getCategoryDisplayName(product.type, product.drinkType || 'ALCOHOLIC'),
            }));
          
          console.log('Productos cargados:', this.products.length);
        } else {
          console.error('Error al cargar productos:', response.message);
          this.products = []; // Array vacío en caso de error
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error en la petición:', error);
        this.products = []; // Array vacío en caso de error
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
// Método para construir la URL completa de la imagen
   private getFullImageUrl(imagePath: string | null): string {
  if (!imagePath) {
    console.log('🖼️ Imagen nula, usando default');
    return 'assets/images/defaultProduct.jpg';
  }
  
  if (imagePath.startsWith('http')) {
    console.log('🖼️ URL completa:', imagePath);
    return imagePath;
  }
  
  const baseUrl = BASE_PATH_IMAGES_PRODUCTS;
  const fullUrl = `${baseUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  
 
  
  return fullUrl;
}
 
  // Método para obtener nombre de categoría display
  private getCategoryDisplayName(type: string, drinkType?: string): string {
    switch (type) {
      case 'DRINK':
        return drinkType === 'ALCOHOLIC' ? 'Bebida Alcohólica' : 
               drinkType === 'NON_ALCOHOLIC' ? 'Bebida No Alcohólica' : 'Bebida';
      case 'SNACK':
        return 'Snack';
      case 'RECETARIO':
        return 'Receta';
      default:
        return 'Producto';
    }
  }
  
 ngAfterViewInit() {
  AOS.init({
    duration: 800,
    once: true,
    offset: 100
  });

  register();

 
  
}

  // Método para abrir el modal en la imagen específica
  showImage(index: number) {
    this.activeIndex = index;
    this.displayModal = true;
    
    // Esperar a que el modal se renderice para inicializar Swiper
    setTimeout(() => {
      this.initSwiper();
    }, 100);
  }

  initSwiper() {
  const swiperEl = this.swiperRef?.nativeElement;
  if (!swiperEl) return;

  const swiper = swiperEl.swiper;

  // Evitar reconfigurar si ya existe
  if (swiper && !swiper.destroyed) {
    swiper.slideTo(this.activeIndex);
    swiper.update();
    return;
  }

  // Configuración solo una vez
  Object.assign(swiperEl, {
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: true,
    navigation: true, 
    pagination: {
      type: 'fraction'
    },
    zoom: true,
    keyboard: { enabled: true },
    on: {
      slideChange: () => {
        this.activeIndex = swiper.activeIndex;
        this.cdr.detectChanges();
      }
    }
  });

  // Registrar Swiper si no lo está
  swiperEl.initialize();
}


  // Método para cerrar el modal
  hideGallery() {
    this.displayModal = false;
  }


 changeImage(index: number) {
    this.activeIndexGalleria = index;
    this.cdr.detectChanges(); // Forzar detección de cambios
  }



 // Método para agregar producto al carrito
  addToCart(product: ProductsDtoTable): void {

    this.cartService.addToCart(product);
    this.messageService.info('Compras', 'Producto agregado al carrito');
    console.log(' Producto agregado al carrito:', product.name);
  }

    


    getSeverity(status: string) {
        switch (status) {
            case 'INSTOCK':
                return 'success';
            case 'LOWSTOCK':
                return 'warn';
            case 'OUTOFSTOCK':
                return 'danger';
                default:
                  return 'siccess';
        }
    }

  


}