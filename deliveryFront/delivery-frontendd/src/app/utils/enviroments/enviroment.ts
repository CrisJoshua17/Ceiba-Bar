// API Gateway - Puerto único para todos los microservicios
export const API_GATEWAY = 'http://localhost:8090';

// Endpoints centralizados a través del Gateway
export const BASE_ENDPOINT_MICRO_AUTH = `${API_GATEWAY}/api/auth`;
export const BASE_ENDPOINT_MICRO_CUSTOMER = `${API_GATEWAY}/api/customers`;
export const BASE_ENDPOINT_MICRO_USERS = `${API_GATEWAY}/api/users`;
export const BASE_ENDPOINT_MICRO_PRODUCTS = `${API_GATEWAY}/api/products`;
export const BASE_ENDPOINT_MICRO_PAYMENTS = `${API_GATEWAY}/api/payments`;
export const BASE_ENDPOINT_MICRO_ORDERS = `${API_GATEWAY}/api/orders`;
export const BASE_ENDPOINT_MICRO_DRIVERS = `${API_GATEWAY}/api/drivers`;
export const BASE_ENDPOINT_MICRO_DELIVERY = `${API_GATEWAY}/api/delivery`;
export const BASE_ENDPOINT_MICRO_TRACKING = `${API_GATEWAY}/api/tracking`;

// Rutas para imágenes (aún directas a los microservicios)
export const BASE_PATH_IMAGES = "http://localhost:8089";
export const BASE_PATH_IMAGES_PRODUCTS = "http://localhost:8087";

// WebSocket endpoint
export const WS_TRACKING = 'ws://localhost:8090/ws/tracking';