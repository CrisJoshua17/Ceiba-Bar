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
  apiGateway: 'https://api.ceiba-bar.com', // Reemplazar con dominio real

  // --- Keycloak ---
  keycloak: {
    url: 'https://auth.ceiba-bar.com',     // Reemplazar con dominio real
    realm: 'ceiba-bar',
    clientId: 'ceiba-frontend-angular',
  },

  // --- WebSocket ---
  wsTracking: 'wss://api.ceiba-bar.com/ws/tracking',

  // --- Imágenes ---
  imageBasePathUsers: 'https://api.ceiba-bar.com',
  imageBasePathProducts: 'https://api.ceiba-bar.com',
};
