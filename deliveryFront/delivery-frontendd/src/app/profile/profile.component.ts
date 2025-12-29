import { ChangeDetectorRef, Component, OnInit, ViewChild, effect } from '@angular/core';
import { UsersService } from '../services/users.service';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule, FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { MessagesService } from '../services/messages.service';
import { ImagesService } from '../services/images.service';
import { Address, CreateAddressDto, UserAdminDto, UserData } from '../model/Dtos';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BASE_PATH_IMAGES } from '../utils/enviroments/enviroment';
import { NavbarCustomerComponent } from '../navbar-customer/navbar-customer.component';
import { NavbarSimpleComponent } from '../utils/navbar-simple/navbar-simple.component';
import { NavbarDriverComponent } from '../navbar-driver/navbar-driver.component';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from "primeng/table";
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';


@Component({
  selector: 'app-profile',
  imports: [
    NavbarAdminComponent,
    CardModule,
    AvatarModule,
    ImageModule,
    ButtonModule,
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    FileUploadModule,
    ToastModule,
    MessageModule,
    ConfirmDialogModule,
    NavbarCustomerComponent,
    NavbarSimpleComponent,
    NavbarDriverComponent,
    DialogModule,
    TableModule,
    FormsModule,
    SelectModule,
    CheckboxModule
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {

  @ViewChild('fileUpload') fileUpload!: FileUpload;

  userData: UserData | null = null;
  userForm!: FormGroup;
  addressForm!: FormGroup;
  selectedFile: File | null = null;
  selectedImage: string | ArrayBuffer | null = null;
  imageError: string = '';
  hasImageError: boolean = false;
  rol!: string;
  addresses: Address[] = [];
  selectAddress: Address | null = null;
  private baseUrl = BASE_PATH_IMAGES;

  visible = false;

  constructor(
    private userService: UsersService, 
    private fb: FormBuilder, 
    private mensajeService: MessagesService,
    private cdr: ChangeDetectorRef,
    private imagenService: ImagesService,

    private fbAddress: FormBuilder,

  ) {
    effect(() => {
      const data = this.userService.userData();
      if (data) {
        this.userData = data;
        this.rol = data.user.role;
        
        // Cargar direcciones si existen en el objeto user (customer)
        if (data.customer && data.customer.addresses) {
            this.addresses = data.customer.addresses;
        }

        this.patchFormWithUserData();
      }
    });
  }

  ngOnInit(): void {
    this.initForm(); 
    if (!this.userService.userData()) {
      this.userService.getUserInfo().subscribe();

    }
    this.initFormAddress();
  }

  initForm() {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern('[0-9]{10}')]],
      image: ['', ],
    });
  }

  initFormAddress() {
    this.addressForm = this.fbAddress.group({
      alias: ['', [Validators.required]],
      street: ['', [Validators.required]],
      colonia: ['', [Validators.required]],
      city: ['Ciudad de México', [Validators.required]],
      state: ['', [Validators.required]],
      delegacion: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      instructions: ['', ],
      isDefault: [false],
    });
  }

 patchFormWithUserData() {
  if (this.userData && this.userData.user && this.userForm) {
    const user = this.userData.user;
    
    this.userForm.patchValue({
      nombre: user.name || '',
      apellido: user.lastName || '',
      email: user.email || '',
      telefono: user.phone || '',
      image: user.image || ''
    });
    
    // Resetear siempre a la imagen del usuario
    this.selectedFile = null;
    if (user.image) {
      this.selectedImage = this.getImageUrl(user.image);
    } else {
      this.selectedImage = 'https://primefaces.org/cdn/primeng/images/galleria/galleria10.jpg';
    }
    this.hasImageError = false;
    this.imageError = '';
  }
}

  async onImageSelect(event: FileSelectEvent) {
  this.imageError = '';
  this.hasImageError = false;
  
  if (event.files && event.files.length > 0) {
    const file = event.files[0];
    
    const result = this.imagenService.validateImage(file);

    if (!result.ok) {
      this.imageError = result.error!;
      this.hasImageError = true;
      this.clearFileUpload();
      return;
    }
    
    this.selectedFile = file;
    
    // Generar preview y asignar directamente
    this.selectedImage = await this.imagenService.generatePreview(file);
    
    this.mensajeService.info("Éxito", "Imagen seleccionada correctamente");
    this.cdr.detectChanges(); // Forzar detección de cambios
  }
}

 onImageClear() {
  this.selectedFile = null;
  // Volver a la imagen original del usuario
  if (this.userData?.user?.image) {
    this.selectedImage = this.getImageUrl(this.userData.user.image);
  } else {
    this.selectedImage = 'https://primefaces.org/cdn/primeng/images/galleria/galleria10.jpg';
  }
  this.imageError = '';
  this.hasImageError = false;
  
  this.clearFileUpload();
  this.cdr.detectChanges();
}

  private clearFileUpload() {
    if (this.fileUpload) {
      this.fileUpload.clear();
      // Forzar limpieza del input file
      setTimeout(() => {
        const fileInput = document.querySelector('p-fileUpload input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }, 0);
    }
  }

 onSubmit() {
  if (this.userForm.invalid || this.hasImageError) {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
    return;
  }

  if (!this.userData?.user?.id) {
    this.mensajeService.error("Error", "No se pudo obtener la información del usuario");
    return;
  }

  const userId = this.userData.user.id;


  const formData = new FormData();
  
  // Agregar datos del formulario - CORREGIR NOMBRES
  formData.append('name', this.userForm.get('nombre')?.value);
  formData.append('lastName', this.userForm.get('apellido')?.value);
  formData.append('email', this.userForm.get('email')?.value);
  
  
  const telefonoValue = this.userForm.get('telefono')?.value;
  if (telefonoValue) {
    formData.append('phone', telefonoValue.toString()); // Enviar como string
  }
  
  // Agregar imagen si existe
  if (this.selectedFile) {
    formData.append('image', this.selectedFile, this.selectedFile.name);
  }

  // Llamar al servicio
  this.userService.actualizarPerfilConFormData(userId, formData).subscribe({
    next: (response) => {
      if(response.success){
        this.mensajeService.success("Éxito", "Perfil actualizado correctamente");
        this.userService.getUserInfo().subscribe();
        
      }else{
      this.mensajeService.error("Error", "No se pudo actualizar el perfil");  
      }
    },
    error: (error) => {
      console.error('Error:', error);
      this.mensajeService.warn("Error", "Lo sentimos por el momento no podemos actualizar");
    }
  });
}

  onReset() {
    this.userForm.reset();
    this.onImageClear();
    this.patchFormWithUserData();
    this.cdr.detectChanges();
  }

  showDialog() {
     this.visible = true;
  }


 eliminar(event: Event) {
  const messages = {
    mensaje: "¿Seguro que deseas eliminar?",
    summary: "Success",
    detail: "Eliminado con éxito",
    summaryFail: "Error",
    detailFail: "Lo sentimos no se pudo eliminar",
    summaryReject: "Cancelado",
    detailReject: "No se eliminará"
  };

  if (this.userData && this.userData.user) {
      this.mensajeService.confirmDelete(
        event,
        messages,
        this.userData.user
      );
  }
}


getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return 'https://primefaces.org/cdn/primeng/images/galleria/galleria10.jpg';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.baseUrl}${normalizedPath}`;
}

agregarAddress() {
  if (this.addressForm.invalid) {
    Object.keys(this.addressForm.controls).forEach(key => {
      this.addressForm.get(key)?.markAsTouched();
    });
    return;
  }

  // Crear objeto con el DTO correcto
  const addressData: CreateAddressDto = {
    alias: this.addressForm.get('alias')?.value,
    street: this.addressForm.get('street')?.value,
    colonia: this.addressForm.get('colonia')?.value,
    city: 'Ciudad de México', // Hardcoded por validación de backend
    state: this.addressForm.get('state')?.value,
    delegacion: this.addressForm.get('delegacion')?.value,
    postalCode: this.addressForm.get('postalCode')?.value,
    instructions: this.addressForm.get('instructions')?.value || '',
    isDefault: this.addressForm.get('isDefault')?.value || false
  };

  this.userService.agregarAddress(addressData).subscribe({
    next: (response) => {
      if (response.success) {
        this.mensajeService.success("Éxito", "Dirección agregada correctamente");
        this.userService.getUserInfo().subscribe();
        this.visible = false;
        this.addressForm.reset();
        // Resetear el valor de isDefault
        this.addressForm.get('isDefault')?.setValue(false);
      } else {
        this.mensajeService.error("Error", response.message || "No se pudo agregar la dirección");
      }
    },
    error: (error) => {
      console.error('Error:', error);
      this.mensajeService.warn("Error", "Lo sentimos por el momento no podemos agregar la dirección");
    }
  });
}






  
  // Helper methods para acceder fácilmente a los controles
  get nombre() { return this.userForm.get('nombre'); }
  get apellido() { return this.userForm.get('apellido'); }
  get email() { return this.userForm.get('email'); }
  get telefono() { return this.userForm.get('telefono'); }
}