import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, signal } from '@angular/core';
import { BASE_ENDPOINT_MICRO_DRIVERS, BASE_ENDPOINT_MICRO_USERS } from '../utils/enviroments/enviroment';
import { ApiResponseAll, UserInfo, UserRole } from '../model/Dtos';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DriversService {

  constructor(private http:HttpClient) { }

public baseEndpoint =BASE_ENDPOINT_MICRO_USERS;
public baseEndpointDrivers =BASE_ENDPOINT_MICRO_DRIVERS;

 // 1. Signal para almacenar y compartir los datos del usuario
  public driversDataSignal: WritableSignal<UserInfo[] | null> = signal<UserInfo[] | null>(null);
  
  // 2. Signal de solo lectura para exponer al exterior
  public driversData = this.driversDataSignal.asReadonly();



getAllDrivers(UserRole:UserRole){
  return this.http.get<ApiResponseAll<UserInfo[]>>(`${this.baseEndpoint}/role/${UserRole}`).pipe(
    tap(response => {
      // Guardar los datos del usuario cuando se obtengan
      if(response.success && response.data) {
           this.driversDataSignal.set(response.data);
      }
    })
  );
}


}
