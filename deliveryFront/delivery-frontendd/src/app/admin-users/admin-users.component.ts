import { ChangeDetectorRef, Component, OnInit, ViewChild, signal, computed, WritableSignal } from '@angular/core';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UsersService } from '../services/users.service';
import { MessagesService } from '../services/messages.service';
import { UserAdminDto, UsersDtoTable, UserRole } from '../model/Dtos';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { BASE_PATH_IMAGES } from '../utils/enviroments/enviroment';
import { FileUploadModule, FileSelectEvent, FileUpload } from 'primeng/fileupload';
import {  ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';


@Component({
  selector: 'app-admin-users',
  imports: [
    NavbarAdminComponent, 
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
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
   @ViewChild('fileUpload') fileUpload!: FileUpload;
   
  // Signals para búsqueda
  searchAdmins = signal('');
  searchDrivers = signal('');
  searchCustomers = signal('');
  
  // Signals para datos
  admins: WritableSignal<UsersDtoTable[]> = signal([]);
  drivers: WritableSignal<UsersDtoTable[]> = signal([]);
  customers: WritableSignal<UsersDtoTable[]> = signal([]);
  
  isLoading = signal(false);

 
  protected readonly UserRole = UserRole;

  // Computed signals para filtrado
  filteredAdmins = computed(() => this.filterUsers(this.admins(), this.searchAdmins()));
  filteredDrivers = computed(() => this.filterUsers(this.drivers(), this.searchDrivers()));
  filteredCustomers = computed(() => this.filterUsers(this.customers(), this.searchCustomers()));

  visible: boolean = false;
  selectedUser: UsersDtoTable | null = null;
  userForm: FormGroup;
   private baseUrl = BASE_PATH_IMAGES;
   selectedFile: File | null = null;
   createSelectedFile: File | null = null;
     imagePreview: string | null = null;

  visibleCreate: boolean = false;
  selectedRoleForCreate: UserRole | '' = ''; 

  createUserForm: FormGroup;

  constructor(
    private userService: UsersService,
    private messageService: MessagesService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });
     // Formulario para crear
    this.createUserForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (!response.success) {
          this.messageService.warn("Error", "Tuvimos un error al cargar usuarios");
          this.isLoading.set(false);
          return;
        }

        const data = response.data;

        // Actualizamos los signals
        this.admins.set(data
          .filter((u: any) => u.role === UserRole.ADMIN)
          .map(this.convertDatatoUser));

        this.drivers.set(data
          .filter((u: any) => u.role === UserRole.DRIVER)
          .map(this.convertDatatoUser));
        
        this.customers.set(data
          .filter((u: any) => u.role === UserRole.CUSTOMER)
          .map(this.convertDatatoUser));

        this.messageService.info("Éxito", response.message);
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.error("Error", "Hubo un problema cargando los usuarios");
        this.isLoading.set(false);
      }
    });
  }

  saveUser() {
    if (!this.selectedUser) return;

    const userId = this.selectedUser.id;

    const formData = new FormData();
    
    // Agregar datos del formulario
    formData.append('name', this.userForm.get('name')?.value);
    formData.append('lastName', this.userForm.get('lastName')?.value);
    formData.append('email', this.userForm.get('email')?.value);
    formData.append('phone', this.userForm.get('phone')?.value || '');
    
    // Agregar archivo si se seleccionó uno
    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    this.userService.actualizarPerfilConFormData(userId, formData).subscribe({
      next: (response) => {
        if(response.success){
          this.messageService.success("Éxito", "Perfil actualizado correctamente");
          this.loadUsers();
          this.hideDialog();
        } else {
          this.messageService.error("Error", "No se pudo actualizar el perfil");  
        }
      },
      error: (error) => {
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
    this.imagePreview = this.getImageUrl(this.selectedUser?.image || null);
  }


  convertDatatoUser(user: any): UsersDtoTable {
    return {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
       image: user.image,
       id:user.id,
       role: user.role as UserRole
    };
  }

  // Métodos de filtrado optimizados
  private filterUsers(users: UsersDtoTable[], searchTerm: string): UsersDtoTable[] {
    if (!searchTerm.trim()) {
      return [...users];
    }

    const term = searchTerm.toLowerCase().trim();
    return users.filter(user => {
      const phoneStr = user.phone ? user.phone.toString().toLowerCase() : '';
      return (
        user.name.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        phoneStr.includes(term)
      );
    });
  }

  // Método para limpiar búsqueda
  clearSearch(tab: string) {
    switch(tab) {
      case 'admins':
        this.searchAdmins.set('');
        break;
      case 'drivers':
        this.searchDrivers.set('');
        break;
      case 'customers':
        this.searchCustomers.set('');
        break;
    }
  }

 showDialog(user: UsersDtoTable) {
  this.selectedUser = user;
  this.userForm.patchValue({
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || ''
  });
  
  this.imagePreview = this.getImageUrl(user.image); // Usar la imagen del usuario actual
  this.selectedFile = null; // Limpiar archivo seleccionado
  
  if (this.fileUpload) {
    this.fileUpload.clear();
  }
  
  this.visible = true;
}

showDialogCreate(){
this.visible = true;
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
    this.selectedUser = null;
    this.userForm.reset();
     if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

 eliminar(event: Event, user  : UsersDtoTable) {
  console.log(user);
  if (!user) return;

  const messages = {
    mensaje: "¿Seguro que deseas eliminar?",
    summary: "Success",
    detail: "Eliminado con éxito",
    summaryFail: "Error",
    detailFail: "Lo sentimos no se pudo eliminar",
    summaryReject: "Cancelado",
    detailReject: "No se eliminará"
  };

  this.messageService.confirmDeleteUsers(
    event,
    messages,
    user,
    () => {
      this.loadUsers();
    }
  );
  this.cdr.detectChanges();
}

 // Método para mostrar modal de creación
  showCreateDialog(role: UserRole) {
    this.selectedRoleForCreate = role;
    this.createUserForm.reset();
    this.createSelectedFile = null;
    this.visibleCreate = true;
  }

  // Método para crear usuario
 createUser() {
  if (this.createUserForm.invalid) {
    this.messageService.warn("Formulario inválido", "Por favor complete todos los campos requeridos");
    return;
  }

  const userData = {
    name: this.createUserForm.get('name')?.value,
    lastName: this.createUserForm.get('lastName')?.value,
    email: this.createUserForm.get('email')?.value,
    phone: this.createUserForm.get('phone')?.value || '',
    password: this.createUserForm.get('password')?.value
  };

  this.userService.crearUsuario(userData, this.selectedRoleForCreate).subscribe({
    next: (response) => {
      if(response.success){
        const roleName = this.getRoleName(this.selectedRoleForCreate as UserRole);
        this.messageService.success("Éxito", `${roleName} creado correctamente`);
        this.loadUsers();
        this.hideCreateDialog();
      } else {
        this.messageService.error("Error", response.message || "No se pudo crear el usuario");  
      }
    },
    error: (error) => {
      console.error('Error:', error);
      let errorMessage = "Lo sentimos, no podemos crear el usuario en este momento";
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 403) {
        errorMessage = "No tienes permisos para crear este tipo de usuario";
      } else if (error.status === 409) {
        errorMessage = "El email ya está registrado";
      }
      
      this.messageService.warn("Error", errorMessage);
    }
  });
}

// Método auxiliar para obtener nombre del rol
private getRoleName(role: UserRole): string {
  const roles: { [key in UserRole]: string } = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.DRIVER]: 'Conductor', 
    [UserRole.CUSTOMER]: 'Cliente'
  };
  return roles[role] || 'Usuario';
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
    this.selectedRoleForCreate = '';
    this.createUserForm.reset();
    this.createSelectedFile = null;
  }
}