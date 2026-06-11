import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, signal } from '@angular/core';
import { BASE_ENDPOINT_MICRO_DRIVERS, BASE_ENDPOINT_MICRO_USERS, API_GATEWAY } from '../utils/enviroments/enviroment';
import { ApiResponseAll, UserInfo, UserRole } from '../model/Dtos';
import { tap } from 'rxjs';

export interface DriverProfile {
  id: number;           // ID numérico de micro_drivers (el que necesita /assign)
  userId: string;       // UUID de Keycloak
  userEmail: string;
  rating: number;
  totalDeliveries: number;
  available: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DriversService {

  constructor(private http:HttpClient) { }

public baseEndpoint = BASE_ENDPOINT_MICRO_USERS;
public baseEndpointDrivers = BASE_ENDPOINT_MICRO_DRIVERS;
private driversEndpoint = `${API_GATEWAY}/api/drivers`;

 // Signal para drivers de micro_users (UserInfo con UUID)
  public driversDataSignal: WritableSignal<UserInfo[] | null> = signal<UserInfo[] | null>(null);
  public driversData = this.driversDataSignal.asReadonly();

  // Signal para perfiles de drivers de micro_drivers (con id Long)
  public driverProfilesSignal: WritableSignal<DriverProfile[] | null> = signal<DriverProfile[] | null>(null);
  public driverProfiles = this.driverProfilesSignal.asReadonly();


getAllDrivers(UserRole:UserRole){
  return this.http.get<ApiResponseAll<UserInfo[]>>(`${this.baseEndpoint}/role/${UserRole}`).pipe(
    tap(response => {
      if(response.success && response.data) {
           this.driversDataSignal.set(response.data);
      }
    })
  );
}

/** Obtiene los perfiles completos de drivers (con id numérico para /assign) */
getAllDriverProfiles(){
  return this.http.get<ApiResponseAll<DriverProfile[]>>(`${this.driversEndpoint}`).pipe(
    tap(response => {
      if(response.success && response.data) {
        this.driverProfilesSignal.set(response.data);
      }
    })
  );
}


}
