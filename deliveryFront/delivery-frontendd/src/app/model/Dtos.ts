export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  CUSTOMER = 'CUSTOMER'
}

export interface UserDto{
    email:string,
    password: string

}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiResponseAll<T> {
  data: T;
  success: boolean;
  count: number;
  message: string;
  timestamp: string;
}

export interface UserRegisterGenericDto{
  name: string;
  lastName: string;
  email:string;
  password: string;
  phone:number;
}

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
  phone?: string;
  lastName?: string;
}

export interface Customer {
  id: number;
  userId: number;
  totalOrders: number;
  addresses: Address[];
}

export interface UserData {
  user: UserInfo;
  driver: any;
  customer: Customer; 
}

export interface UserAdminDto{
  name: string;
  lastName: string;
  email:string;
  password: string;
  phone:number;
  photo:File | null;
  id: number;
}

export interface UsersDtoTable{
  id: number;
  name: string;
  lastName: string;
  email:string;
  phone:string;
  image: string;
  role: UserRole;
}

export interface ConfirmDeleteMessages {
  mensaje: string;
  summary: string;
  detail: string;
  summaryFail: string;
  detailFail: string;
  summaryReject: string;
  detailReject: string;
}

export interface ProductsDtoTable {
  id: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
  image: string | null; // base64 desde backend
  type: 'DRINK' | 'SNACK' | 'RECETARIO';
  drinkType?: string | null;
}

export interface Drink extends ProductsDtoTable {
  type: 'DRINK';
  drinkType: 'ALCOHOLIC' | 'NON_ALCOHOLIC';
}

export interface ProductRequest {
    name: string;
    description: string;
    price: number;
    available: boolean;
    type: string; // "DRINK", "SNACK", "RECETARIO"
    image: File | null; // opcional
}




export enum DrinkType {
  ALCOHOLIC = 'ALCOHOLIC',
  NON_ALCOHOLIC = 'NON_ALCOHOLIC'
} 

export interface AlcholicDrinksDto{
  type: DrinkType;
}

export interface NonAlcholicDrinksDto{
  type: DrinkType;
}



export interface SnacksDto extends ProductsDtoTable {
  
}

export interface ReceiptDto extends ProductsDtoTable{
  
} 

export interface CartItem {
  product: ProductsDtoTable;
  quantity: number;
}


export interface Address{
    id: number;
  alias: string;
  street: string;
  colonia: string;
  city: string;
  state: string;
  delegacion: string; 
  postalCode: string;
  instructions: string;
  isDefault: boolean;
}
export interface CreateAddressDto {
  alias: string;
  street: string;
  colonia: string;
  city: string;
  state: string;
  delegacion: string;
  postalCode: string;
  instructions?: string;
  isDefault?: boolean;
}
export interface ProductDto {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    available?: boolean;
}

export interface OrderDto {
    id?: number;
    userId?: number;
    customerName: string;
    customerEmail: string;
    address: string;
    destinationLat: number;
    destinationLng: number;
    products: ProductDto[];
    status?: string;
    // Rating fields
    rating?: number; // 1-5 stars
    feedback?: string;
    ratedAt?: string;
    // Delivery fields (enriched)
    driverId?: number;
    driverName?: string;
    assignedAt?: string;
    completedAt?: string;
    deliveryTime?: string;
}

export interface CheckoutRequest {
    orderDto: OrderDto;
    amount: number;
    itemProduct: string;
}


export interface AssignDriverRequest {
  orderId: number;
  driverId: number;
  notes?: string;
}

export interface DeliveryResponse {
  success: boolean;
  message: string;
  data: any;
  timestamp: string;
  status: number;
}

export interface DeliveryDto {
    id: number; // Delivery ID
    orderId: number;
    driverId: number;
    status: string; // Order Status
    customerName: string;
    customerEmail: string;
    address: string;
    assignedAt: string;
    startedAt?: string;
    completedAt?: string;
    notes?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    products?: any[]; // For dialog display
}
