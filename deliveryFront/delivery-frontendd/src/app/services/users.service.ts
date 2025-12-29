import { HttpClient } from '@angular/common/http';
import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { BASE_ENDPOINT_MICRO_AUTH, BASE_ENDPOINT_MICRO_USERS, BASE_ENDPOINT_MICRO_CUSTOMER } from '../utils/enviroments/enviroment';
import { Address, ApiResponse, ApiResponseAll, CreateAddressDto, UserAdminDto, UserData, UserInfo, UserRegisterGenericDto, UserRole } from '../model/Dtos';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http:HttpClient) { }


public baseEndpoint =BASE_ENDPOINT_MICRO_USERS;
public baseEndpointAuth =BASE_ENDPOINT_MICRO_AUTH;
public baseEndpointCustomer =BASE_ENDPOINT_MICRO_CUSTOMER;


  // 1. Signal para almacenar y compartir los datos del usuario
  public userDataSignal: WritableSignal<UserData | null> = signal<UserData | null>(null);
  
  // 2. Signal de solo lectura para exponer al exterior
  public userData = this.userDataSignal.asReadonly();

  // 3. Computed signal para obtener el rol actual
  public currentUserRole = computed(() => this.userDataSignal()?.user?.role);


public registerGeneric(userRegister: UserRegisterGenericDto){
        return this.http.post<Response>(this.baseEndpoint+'/register',userRegister);
    }

    getUserInfo(): Observable<ApiResponse<UserData>> {
  return this.http.get<ApiResponse<UserData>>(this.baseEndpointAuth + '/user-info')
    .pipe(
      tap(response => {
        // Guardar los datos del usuario cuando se obtengan
        if(response.success && response.data) {
             this.userDataSignal.set(response.data);
        }
      })
    );
}

crearUsuario(userData: any, role: string): Observable<any> {
  let endpoint = '';
   // Normalizamos a mayúsculas para comparar con el Enum, aunque idealmente debería venir ya tipado
   const normalizedRole = role.toUpperCase(); 
   
  switch(normalizedRole) {
    case UserRole.ADMIN:
      endpoint = `${this.baseEndpoint}/admins`;
      break;
    case UserRole.DRIVER:
      endpoint = `${this.baseEndpoint}/drivers`;
      break;
    case UserRole.CUSTOMER:
      endpoint = `${this.baseEndpoint}/register`;
      break;
    default:
      throw new Error(`Rol no válido: ${role}`);
  }

  return this.http.post(endpoint, userData);
}


getCurrentUserRole(): Observable<string> {
  return this.getUserInfo().pipe(
    map(response => response.data.user.role)
  );
}

// Método para obtener todos los datos del usuario (user, driver, customer)
  getUserProfileData(): Observable<any> {
    return this.getUserInfo().pipe(
      map(response => response.data)
    );
  }

  // Método para verificar si hay datos guardados
  getStoredUserData(): UserData | null {
    return this.userDataSignal();
  }


  actualizarPerfilConFormData(userId: number, formData: FormData) {
  return this.http.put<ApiResponse<any>>(`${this.baseEndpoint}/${userId}`, formData);
}

eliminarPerfilConFormData(userId: number){
  return this.http.delete<ApiResponse<any>>(`${this.baseEndpoint}/${userId}`);
}

getAllUsers(){
  return this.http.get<ApiResponseAll<any[]>>(`${this.baseEndpoint}`);
}


agregarAddress(address: CreateAddressDto){
  return this.http.post<ApiResponse<any>>(`${this.baseEndpointCustomer}/my-profile/addresses`, address);
}

logout() {
  // 1. Limpiar localStorage
  localStorage.removeItem('token');
  // 2. Limpiar Signal
  this.userDataSignal.set(null);
}


}
