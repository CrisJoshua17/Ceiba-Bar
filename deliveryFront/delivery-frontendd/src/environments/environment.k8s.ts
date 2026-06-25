// ============================================================
// ENVIRONMENT — KUBERNETES LOCAL (Minikube)
// ============================================================
// Usado cuando se compila la imagen Docker para despliegue
// en Minikube con los dominios *.ceiba-bar.local.
//
// Compilar con:
//   ng build --configuration k8s
// o (Dockerfile):
//   npm run build -- --configuration k8s
// ============================================================

export const environment = {
  production: true,

  // --- API Gateway ---
  apiGateway: 'http://api.ceiba-bar.local',

  // --- Keycloak ---
  keycloak: {
    url: 'http://auth.ceiba-bar.local',
    realm: 'ceiba-bar',
    clientId: 'ceiba-frontend-angular',
  },

  // --- Endpoints (derivados del Gateway) ---
  endpoints: {
    auth:     'http://api.ceiba-bar.local/api/auth',
    customers:'http://api.ceiba-bar.local/api/customers',
    users:    'http://api.ceiba-bar.local/api/users',
    products: 'http://api.ceiba-bar.local/api/products',
    payments: 'http://api.ceiba-bar.local/api/payments',
    orders:   'http://api.ceiba-bar.local/api/orders',
    drivers:  'http://api.ceiba-bar.local/api/drivers',
    delivery: 'http://api.ceiba-bar.local/api/delivery',
    tracking: 'http://api.ceiba-bar.local/api/tracking',
  },

  // --- WebSocket ---
  wsTracking: 'ws://api.ceiba-bar.local/ws/tracking',

  // --- Imágenes ---
  imageBasePathUsers:    'http://api.ceiba-bar.local/api/users',
  imageBasePathProducts: 'http://api.ceiba-bar.local/api/products',
};
