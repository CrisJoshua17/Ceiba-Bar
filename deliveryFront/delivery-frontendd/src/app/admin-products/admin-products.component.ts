import { ChangeDetectorRef, Component, ViewChild, WritableSignal, computed, signal } from '@angular/core';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { ReactiveFormsModule } from '@angular/forms';
import { FileSelectEvent, FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { Drink, DrinkType, ProductsDtoTable, ReceiptDto, SnacksDto, UsersDtoTable } from '../model/Dtos';
import { BASE_PATH_IMAGES, BASE_PATH_IMAGES_PRODUCTS } from '../utils/enviroments/enviroment';
import { ProductsService } from '../services/products.service';
import { MessagesService } from '../services/messages.service';

@Component({
  selector: 'app-admin-products',
  imports: [NavbarAdminComponent,
     CardModule, 
    TabsModule, 
    TableModule,
    ToastModule, 
    FormsModule, 
    CommonModule, 
    ButtonModule,
    DialogModule,
    AvatarModule,
    ReactiveFormsModule,
    FileUploadModule,
     ConfirmDialogModule,
     MessageModule
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss'
})
export class AdminProductsComponent {
   @ViewChild('fileUpload') fileUpload!: FileUpload;

    // Signals para búsqueda
  searchAlcholicDrinks = signal('');
  searchNonAlcholicDrinks = signal('');
  searchSnacks = signal('');
  searchReceipts = signal('');
  searchProductsAvalible = signal('');
  searchProductsNoAvalible = signal('');

    // Signals para datos
  drinks: WritableSignal<Drink[]> = signal([]);
  snacks: WritableSignal<SnacksDto[]> = signal([]);
  receipts: WritableSignal<ReceiptDto[]> = signal([]);
  productsAvalible: WritableSignal<ProductsDtoTable[]> = signal([]);
  productsNoAvalible: WritableSignal<ProductsDtoTable[]> = signal([]);

selectedTypeForCreate: string = '';
selectedDrinkTypeForCreate: string = '';
  
  isLoading = signal(false);


// Computed signals para filtrado

  filteredAlcholicDrinks = computed(() => {
  const alcoholicDrinks = this.drinks().filter(d => d.drinkType === 'ALCOHOLIC');
  return this.filterProducts(alcoholicDrinks, this.searchAlcholicDrinks());
});

filteredNonAlcholicDrinks = computed(() => {
  const nonAlcoholicDrinks = this.drinks().filter(d => d.drinkType === 'NON_ALCOHOLIC');
  return this.filterProducts(nonAlcoholicDrinks, this.searchNonAlcholicDrinks());
});

  filteredSnacks = computed(() => this.filterProducts(this.snacks(), this.searchSnacks()));
  filteredReceipts = computed(() => this.filterProducts(this.receipts(), this.searchReceipts()));
  filteredProductsAvailable = computed(() => this.filterProducts(this.productsAvalible(), this.searchProductsAvalible()));
  filteredProductsNotAvailable = computed(() => this.filterProducts(this.productsNoAvalible(), this.searchProductsNoAvalible()));



  visible: boolean = false;
  selectedProduct: ProductsDtoTable | null = null;
  productForm: FormGroup;
  private baseUrl = BASE_PATH_IMAGES_PRODUCTS;
  selectedFile: File | null = null;
  createSelectedFile: File | null = null;
  imagePreview: string | null = null;
  visibleCreate: boolean = false;
  createProductForm: FormGroup;

constructor(
    private productService: ProductsService,
    private messageService: MessagesService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],  
      price: ['', [Validators.required, Validators.min(0)]],
      available: [true, Validators.required],
    });
     // Formulario para crear
    this.createProductForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      available: [true, Validators.required],
    });
  }

  private filterProducts<T extends ProductsDtoTable>(items: T[], searchTerm: string): T[] {
    if (!searchTerm.trim()) {
      return [...items];
    }

    const term = searchTerm.toLowerCase().trim();
    return items.filter(item => {
      const priceStr = item.price ? item.price.toString().toLowerCase() : '';
      return (
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.available.toString().toLowerCase().includes(term) ||
        priceStr.includes(term)
      );
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.productService.findAllProducts().subscribe({
      next: (response) => {
        if (!response.success) {
          this.messageService.warn("Error", "Tuvimos un error al cargar productos");
          this.isLoading.set(false);
          return;
        }

        const allProducts = response.data.map(p => ({
          ...p,
          drinkType: (p.type === 'DRINK') ? p.drinkType : null
        }));

        // Actualizamos los signals
        this.productsAvalible.set(allProducts.filter(p => p.available));
        this.productsNoAvalible.set(allProducts.filter(p => !p.available));
        this.drinks.set(allProducts.filter(p => p.type === 'DRINK') as Drink[]);
        this.snacks.set(allProducts.filter(p => p.type === 'SNACK') as ProductsDtoTable[]);
        this.receipts.set(allProducts.filter(p => p.type === 'RECETARIO') as ProductsDtoTable[]);

        this.isLoading.set(false);
        this.messageService.info("Éxito", "Productos cargados correctamente");
      },
      error: () => {
        this.messageService.error("Error", "Error cargando productos");
        this.isLoading.set(false);
      }
    });
  }

  saveProduct() {
    if (!this.selectedProduct) return;

    const productId = this.selectedProduct.id;

    const formData = new FormData();
    
    // Agregar datos del formulario
    formData.append('name', this.productForm.get('name')?.value);
    formData.append('description', this.productForm.get('description')?.value);
    formData.append('price', this.productForm.get('price')?.value);
    formData.append('available', this.productForm.get('available')?.value);
    
    // Agregar archivo si se seleccionó uno
    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    this.productService.updateProduct(productId, formData).subscribe({
      next: (response: any) => {
        if(response.success){
          this.messageService.success("Éxito", "Producto actualizado correctamente"); 
          this.hideDialog();
          this.loadProducts();
           this.cdr.detectChanges();
        } else {
          this.messageService.error("Error", response.message || "No se pudo actualizar el producto");  
        }
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.messageService.warn("Error", "Lo sentimos por el momento no podemos actualizar");
      }
    });
  }

  onFileSelect(event: FileSelectEvent) {
    this.selectedFile = event.files[0];
    
    // Mostrar preview de la imagen seleccionada
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onFileRemove() {
    this.selectedFile = null;
    this.imagePreview = this.getImageUrl(this.selectedProduct?.image || null);
  }

  // Método para limpiar búsqueda
  clearSearch(tab: string) {
    switch(tab) {
      case 'productsAvalible':
        this.searchProductsAvalible.set('');
        break;
      case 'productsNoAvalible':
        this.searchProductsNoAvalible.set('');
        break;
      case 'alcoholicDrinks':
        this.searchAlcholicDrinks.set('');
        break;
      case 'noAlcoholicDrinks':
        this.searchNonAlcholicDrinks.set('');
        break;
      case 'snacks':
        this.searchSnacks.set('');
        break;
      case 'receipts':
        this.searchReceipts.set('');
        break;
    }
  }

  showDialog(product: ProductsDtoTable) {
    this.selectedProduct = product;
    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      description: product.description,
      available: product.available,
    });
    
    this.imagePreview = this.getImageUrl(product.image);
    this.selectedFile = null;
    
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
    
    this.visible = true;
  }

  // CORREGIDO: Cambié el nombre del método para evitar confusión
  showCreateDialog(type: string, drinkType?: string) {
    this.selectedTypeForCreate = type;
    this.selectedDrinkTypeForCreate = drinkType || '';
    this.createProductForm.reset({
      available: true // Reset con valor por defecto
    });
    this.createSelectedFile = null;
    this.visibleCreate = true;
  }

  getImageUrl(imagePath: string | null): string {
    if (!imagePath) {
      return 'https://primefaces.org/cdn/primeng/images/galleria/galleria10.jpg';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  hideDialog() {
    this.visible = false;
    this.selectedProduct = null;
    this.productForm.reset({
      available: true // Reset con valor por defecto
    });
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

  eliminar(event: Event, product: ProductsDtoTable) {
    console.log(product);
    if (!product) return;

    const messages = {
      mensaje: "¿Seguro que deseas eliminar este producto?",
      summary: "Success",
      detail: "Producto eliminado con éxito",
      summaryFail: "Error",
      detailFail: "Lo sentimos no se pudo eliminar el producto",
      summaryReject: "Cancelado",
      detailReject: "No se eliminará el producto"
    };

    this.messageService.confirmDeleteProducts(
      event,
      messages,
      product,
      () => {
        this.loadProducts();
      }
    );
    this.cdr.detectChanges();
  }

  // Método para crear producto
  createProduct() {
  if (this.createProductForm.invalid) {
    this.messageService.warn("Formulario inválido", "Por favor complete todos los campos requeridos");
    return;
  }

  const formData = new FormData();
  formData.append('name', this.createProductForm.get('name')?.value);
  formData.append('description', this.createProductForm.get('description')?.value);
  formData.append('price', this.createProductForm.get('price')?.value);
  formData.append('available', this.createProductForm.get('available')?.value);
  formData.append('type', this.selectedTypeForCreate);

  if (this.selectedTypeForCreate === 'DRINK' && this.selectedDrinkTypeForCreate) {
    formData.append('drinkType', this.selectedDrinkTypeForCreate);
  } 

  if (this.createSelectedFile) {
    formData.append('image', this.createSelectedFile, this.createSelectedFile.name);
  }

  console.log(' Creando producto:', {
    type: this.selectedTypeForCreate,
    drinkType: this.selectedDrinkTypeForCreate
  });

  this.productService.createProduct(formData).subscribe({
    next: (response: any) => {
      console.log(' Respuesta del backend:', response);
      
      if(response.success){
        console.log(' Producto creado con datos:', response.data);
        this.messageService.success("Éxito", `Producto creado correctamente`);
        
        // Recargar todos los productos para asegurar consistencia
        this.loadProducts();
        
        this.hideCreateDialog();
        this.cdr.detectChanges();
      } else {
        this.messageService.error("Error", response.message || "No se pudo crear el producto");  
      }
    },
    error: (error: any) => {
      console.error('❌ Error:', error);
      let errorMessage = "Lo sentimos, no podemos crear el producto en este momento";
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 403) {
        errorMessage = "No tienes permisos para crear este tipo de producto";
      } else if (error.status === 409) {
        errorMessage = "El producto ya está registrado";
      }
      
      this.messageService.warn("Error", errorMessage);
    }
  });
}

  // Método para obtener nombre display del tipo de producto
  getProductTypeDisplayName(): string {
    switch (this.selectedTypeForCreate) {
      case 'DRINK':
        // Mostrar el tipo específico de bebida
        return this.selectedDrinkTypeForCreate === 'ALCOHOLIC' ? 'Bebida Alcohólica' : 
              this.selectedDrinkTypeForCreate === 'NON_ALCOHOLIC' ? 'Bebida No Alcohólica' : 'Bebida';
      case 'SNACK':
        return 'Snack';
      case 'RECETARIO':
        return 'Receta';
      default:
        return 'Producto';
    }
  }

  // Método para obtener el header del diálogo
  getCreateDialogHeader(): string {
    const typeName = this.getProductTypeDisplayName();
    return `Crear ${typeName}`;
  }

  // Manejar selección de archivo para creación
  onCreateFileSelect(event: FileSelectEvent) {
    this.createSelectedFile = event.files[0];
  }

  onCreateFileRemove() {
    this.createSelectedFile = null;
  }

  // Ocultar modal de creación
  hideCreateDialog() {
    this.visibleCreate = false;
    this.selectedTypeForCreate = '';
    this.selectedDrinkTypeForCreate = '';
    this.createProductForm.reset({
      available: true // Reset con valor por defecto
    });
    this.createSelectedFile = null;
  }
}