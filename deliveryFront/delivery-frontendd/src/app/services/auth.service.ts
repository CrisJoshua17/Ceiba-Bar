import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_ENDPOINT_MICRO_AUTH } from '../utils/enviroments/enviroment';
import {  UserDto } from '../model/Dtos';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

public baseEndpoint=BASE_ENDPOINT_MICRO_AUTH;
   
 public login(user: UserDto){
        return this.http.post<Response>(this.baseEndpoint+'/login',user);
    }

  logout() {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  
}
