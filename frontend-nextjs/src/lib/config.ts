export const config = {
  apiGateway: process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8090',
  keycloak: {
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'ceiba-bar',
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'ceiba-frontend-angular',
  },
  wsTracking: process.env.NEXT_PUBLIC_WS_TRACKING || 'ws://localhost:8090/ws/tracking',
  imageBasePathUsers: process.env.NEXT_PUBLIC_IMAGE_PATH_USERS || 'http://localhost:8089',
  imageBasePathProducts: process.env.NEXT_PUBLIC_IMAGE_PATH_PRODUCTS || 'http://localhost:8087',
};
