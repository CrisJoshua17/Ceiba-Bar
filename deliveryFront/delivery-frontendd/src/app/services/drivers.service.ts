import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from '../../environments/environment';
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

public baseEndpoint = environment.endpoints.users;
public baseEndpointDrivers = environment.endpoints.drivers;
private driversEndpoint = environment.endpoints.drivers;

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
