import Keycloak from 'keycloak-js';
import { config } from './config';

let keycloakInstance: Keycloak | null = null;

export const getKeycloakInstance = (): Keycloak | null => {
  if (typeof window !== 'undefined' && !keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: config.keycloak.url,
      realm: config.keycloak.realm,
      clientId: config.keycloak.clientId,
    });
  }
  return keycloakInstance;
};
