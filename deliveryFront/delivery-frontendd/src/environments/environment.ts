// ============================================================
// ENVIRONMENT — DEVELOPMENT
// ============================================================
// Valores por defecto para desarrollo local con Docker Compose.
// Para producción, Angular reemplaza este archivo por
// environment.prod.ts durante `ng build --configuration production`.
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

  // --- WebSocket ---
  wsTracking: 'ws://localhost:8090/ws/tracking',

  // --- Imágenes ---
  imageBasePathUsers: 'http://localhost:8089',
  imageBasePathProducts: 'http://localhost:8087',
};
