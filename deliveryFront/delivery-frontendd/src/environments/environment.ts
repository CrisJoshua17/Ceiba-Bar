// ============================================================
// ENVIRONMENT — DEVELOPMENT
// ============================================================
// Valores por defecto para desarrollo local (ng serve).
// Los microservicios deben correr con mvn spring-boot:run o Docker Compose.
// ============================================================

export const environment = {
  production: false,

  // --- API Gateway ---
  apiGateway: 'http://localhost:8090',

  // --- Keycloak ---
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'ceiba-bar',
    clientId: 'ceiba-frontend-angular',
  },

  // --- Endpoints (derivados del Gateway) ---
  endpoints: {
    auth:     'http://localhost:8090/api/auth',
    customers:'http://localhost:8090/api/customers',
    users:    'http://localhost:8090/api/users',
    products: 'http://localhost:8090/api/products',
    payments: 'http://localhost:8090/api/payments',
    orders:   'http://localhost:8090/api/orders',
    drivers:  'http://localhost:8090/api/drivers',
    delivery: 'http://localhost:8090/api/delivery',
    tracking: 'http://localhost:8090/api/tracking',
  },

  // --- WebSocket ---
  wsTracking: 'ws://localhost:8090/ws/tracking',

  // --- Imágenes ---
  imageBasePathUsers:    'http://localhost:8089',
  imageBasePathProducts: 'http://localhost:8087',
};
