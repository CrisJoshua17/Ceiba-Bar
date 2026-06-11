import { HttpClient } from '@angular/common/http';
import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { Address, ApiResponse, ApiResponseAll, CreateAddressDto, UserAdminDto, UserData, UserInfo, UserRegisterGenericDto, UserRole } from '../model/Dtos';
import { map, Observable, of, tap, switchMap, catchError } from 'rxjs';
import { KeycloakService } from './keycloak.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient, private keycloakService: KeycloakService) {}

  public baseEndpoint = `${environment.apiGateway}/api/users`;
  public baseEndpointCustomer = `${environment.apiGateway}/api/customers`;


  // 1. Signal para almacenar y compartir los datos del usuario
  public userDataSignal: WritableSignal<UserData | null> = signal<UserData | null>(null);
  
  // 2. Signal de solo lectura para exponer al exterior
  public userData = this.userDataSignal.asReadonly();

  // 3. Computed signal para obtener el rol actual
  public currentUserRole = computed(() => this.userDataSignal()?.user?.role);


  public registerGeneric(userRegister: UserRegisterGenericDto) {
    return this.http.post<Response>(this.baseEndpoint + '/register', userRegister);
  }

  /**
   * Obtiene info del usuario combinando el token (para rol/id) con la BD local
   * (para nombre, telefono, imagen actualizados) y el microservicio de perfil.
   */
  getUserInfo(): Observable<ApiResponse<UserData>> {
    const keycloakId = this.keycloakService.getUserId() ?? '';
    const role = (this.keycloakService.getPrimaryRole() as UserRole) ?? UserRole.CUSTOMER;

    // Datos minimos del token para no dejar la UI vacia
    const baseUserInfo: UserInfo = {
      id: keycloakId,
      email: this.keycloakService.getEmail() ?? '',
      name: this.keycloakService.getFullName()?.split(' ')[0] ?? '',
      role,
    };
    this.userDataSignal.set({ user: baseUserInfo, driver: null, customer: { id: 0, userId: 0, totalOrders: 0, addresses: [] } });

    // 1. Obtener datos frescos del usuario desde la BD local (nombre, telefono, imagen)
    return this.http.get<ApiResponse<any>>(`${this.baseEndpoint}/${keycloakId}`).pipe(
      map(resp => resp.data),
      catchError(() => of(null)),
      switchMap(backendUser => {
        // Mezclar datos del token con datos frescos de la BD
        const enrichedUserInfo: UserInfo = {
          id: keycloakId,
          email: backendUser?.email ?? baseUserInfo.email,
          name: backendUser?.name ?? baseUserInfo.name,
          lastName: backendUser?.lastName,
          phone: backendUser?.phone,
          image: backendUser?.image,
          role,
        };

        if (role === UserRole.CUSTOMER) {
          // 2a. Obtener perfil de customer (id numerico, direcciones)
          return this.http.get<ApiResponse<any>>(`${this.baseEndpointCustomer}/my-profile`).pipe(
            switchMap(profileResp => {
              const enrichedData: UserData = {
                user: enrichedUserInfo,
                driver: null,
                customer: profileResp.data || { id: 0, userId: 0, totalOrders: 0, addresses: [] }
              };
              this.userDataSignal.set(enrichedData);
              return of({ success: true, data: enrichedData } as ApiResponse<UserData>);
            }),
            catchError(() => {
              // Si no existe el perfil de customer, crearlo automaticamente
              return this.http.post<any>(
                `${this.baseEndpointCustomer}/internal/create?userId=${keycloakId}&userEmail=${encodeURIComponent(enrichedUserInfo.email)}`,
                {}
              ).pipe(
                catchError(() => of(null)),
                switchMap(created => {
                  const newCustomer = created || { id: 0, userId: 0, totalOrders: 0, addresses: [] };
                  const enrichedData: UserData = { user: enrichedUserInfo, driver: null, customer: newCustomer };
                  this.userDataSignal.set(enrichedData);
                  return of({ success: true, data: enrichedData } as ApiResponse<UserData>);
                })
              );
            })
          );
        } else if (role === UserRole.DRIVER) {
          return this.http.get<ApiResponse<any>>(`${environment.apiGateway}/api/drivers/my-profile`).pipe(
            map(profileResp => {
              const enrichedData: UserData = {
                user: enrichedUserInfo,
                driver: profileResp.data,
                customer: null as any
              };
              this.userDataSignal.set(enrichedData);
              return { success: true, data: enrichedData } as ApiResponse<UserData>;
            }),
            catchError(() => {
              const enrichedData: UserData = { user: enrichedUserInfo, driver: null, customer: null as any };
              this.userDataSignal.set(enrichedData);
              return of({ success: true, data: enrichedData } as ApiResponse<UserData>);
            })
          );
        } else {
          // ADMIN: solo datos del usuario, sin perfil de customer/driver
          const enrichedData: UserData = {
            user: enrichedUserInfo,
            driver: null,
            customer: null as any
          };
          this.userDataSignal.set(enrichedData);
          return of({ success: true, data: enrichedData } as ApiResponse<UserData>);
        }
      })
    );
  }

  /**
   * Refresca solo los datos del usuario desde la BD (tras actualizar perfil).
   * Conserva customer/driver ya cargados en el signal.
   */
  refreshUserFromBackend(): Observable<any> {
    const keycloakId = this.keycloakService.getUserId() ?? '';
    return this.http.get<ApiResponse<any>>(`${this.baseEndpoint}/${keycloakId}`).pipe(
      tap(resp => {
        if (resp.success && resp.data) {
          const current = this.userDataSignal();
          if (current) {
            const updatedUser: UserInfo = {
              ...current.user,
              name: resp.data.name ?? current.user.name,
              lastName: resp.data.lastName ?? current.user.lastName,
              email: resp.data.email ?? current.user.email,
              phone: resp.data.phone ?? current.user.phone,
              image: resp.data.image ?? current.user.image,
            };
            this.userDataSignal.set({ ...current, user: updatedUser });
          }
        }
      }),
      catchError(() => of(null))
    );
  }

  crearUsuario(userData: any, role: string): Observable<any> {
    let endpoint = '';
    const normalizedRole = role.toUpperCase();

    switch (normalizedRole) {
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
        throw new Error(`Rol no valido: ${role}`);
    }

    return this.http.post(endpoint, userData);
  }

  getCurrentUserRole(): Observable<string> {
    return this.getUserInfo().pipe(
      map(response => response.data.user.role)
    );
  }

  getUserProfileData(): Observable<any> {
    return this.getUserInfo().pipe(
      map(response => response.data)
    );
  }

  getStoredUserData(): UserData | null {
    return this.userDataSignal();
  }

  actualizarPerfilConFormData(userId: string, formData: FormData) {
    return this.http.put<ApiResponse<any>>(`${this.baseEndpoint}/${userId}`, formData);
  }

  eliminarPerfilConFormData(userId: string) {
    return this.http.delete<ApiResponse<any>>(`${this.baseEndpoint}/${userId}`);
  }

  getAllUsers() {
    return this.http.get<ApiResponseAll<any[]>>(`${this.baseEndpoint}`);
  }

  agregarAddress(address: CreateAddressDto) {
    return this.http.post<ApiResponse<any>>(`${this.baseEndpointCustomer}/my-profile/addresses`, address);
  }

  logout() {
    this.userDataSignal.set(null);
    this.keycloakService.logout();
  }

}
