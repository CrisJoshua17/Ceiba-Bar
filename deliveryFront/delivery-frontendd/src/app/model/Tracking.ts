export interface Tracking {
  orderId: number;
  status: string;
  lat: number;
  lng: number;
  deliveryLat?: number;
  deliveryLng?: number;
}