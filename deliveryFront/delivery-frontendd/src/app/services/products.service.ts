import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, signal } from '@angular/core';
import { BASE_ENDPOINT_MICRO_AUTH, BASE_ENDPOINT_MICRO_PRODUCTS, BASE_ENDPOINT_MICRO_USERS } from '../utils/enviroments/enviroment';
import { ApiResponse, ApiResponseAll, ProductRequest, ProductsDtoTable } from '../model/Dtos';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {




 constructor(private http:HttpClient) { }



public baseEndpointAuth =BASE_ENDPOINT_MICRO_AUTH;
public baseEndpointProducts =BASE_ENDPOINT_MICRO_PRODUCTS;


// 1. Signal para almacenar y compartir los datos del producto
  private productSignal: WritableSignal<ProductsDtoTable | null> = signal<ProductsDtoTable | null>(null);
  
  // 2. Signal de solo lectura para exponer al exterior
  public productData = this.productSignal.asReadonly();



  findAllProducts(){
    return this.http.get<ApiResponseAll<any[]>>(`${this.baseEndpointProducts}/all`);
  }

  findAllProductsAvalible(){
    return this.http.get<ApiResponseAll<any[]>>(`${this.baseEndpointProducts}`);
  }

  findAllProductsNoAvalible(){
    return this.http.get<ApiResponseAll<any[]>>(`${this.baseEndpointProducts}/no-avalible`);
  }

  createProduct(formData: FormData){
    return this.http.post<ApiResponse<any>>(`${this.baseEndpointProducts}`, formData);
  }

  updateProduct(productId: number, formData: FormData){
    return this.http.put<ApiResponse<any>>(`${this.baseEndpointProducts}/${productId}`, formData);
  }

  deleteProduct(productId: number){
    return this.http.delete<ApiResponse<any>>(`${this.baseEndpointProducts}/${productId}`);
  }

  getProductById(id: number){
    return this.http.get<ApiResponse<ProductsDtoTable>>(`${this.baseEndpointProducts}/${id}`);
  }

  
}
