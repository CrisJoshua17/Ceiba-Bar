// ============================================================
// ENVIRONMENT — PRODUCTION
// ============================================================
// Angular reemplaza environment.ts por este archivo al compilar
// con: ng build --configuration production
//
// ⚠️ Los valores reales se inyectan como variables de entorno
// en el pipeline de CI/CD o en el contenedor Docker.
// Nunca subir credenciales reales a este archivo.
// ============================================================

export const environment = {
  production: true,

  // --- API Gateway ---
  apiGateway: 'https://api.ceiba-bar.com',

  // --- Keycloak ---
  keycloak: {
    url: 'https://auth.ceiba-bar.com',
    realm: 'ceiba-bar',
    clientId: 'ceiba-frontend-angular',
  },

  // --- Endpoints (derivados del Gateway) ---
  endpoints: {
    auth:     'https://api.ceiba-bar.com/api/auth',
    customers:'https://api.ceiba-bar.com/api/customers',
    users:    'https://api.ceiba-bar.com/api/users',
    products: 'https://api.ceiba-bar.com/api/products',
    payments: 'https://api.ceiba-bar.com/api/payments',
    orders:   'https://api.ceiba-bar.com/api/orders',
    drivers:  'https://api.ceiba-bar.com/api/drivers',
    delivery: 'https://api.ceiba-bar.com/api/delivery',
    tracking: 'https://api.ceiba-bar.com/api/tracking',
  },

  // --- WebSocket ---
  wsTracking: 'wss://api.ceiba-bar.com/ws/tracking',

  // --- Imágenes ---
  imageBasePathUsers:    'https://api.ceiba-bar.com',
  imageBasePathProducts: 'https://api.ceiba-bar.com',
};
