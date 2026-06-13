import axios from 'axios';
import { config } from './config';
import { useAuthStore } from '@/store/useAuthStore';

export const api = axios.create({
  baseURL: config.apiGateway,
});

api.interceptors.request.use(
  async (reqConfig) => {
    const state = useAuthStore.getState();
    if (state.authenticated && state.token) {
      // Intentar refrescar el token si le quedan menos de 30 segundos
      await state.refreshToken(30);
      const updatedToken = useAuthStore.getState().token;
      if (updatedToken) {
        reqConfig.headers.Authorization = `Bearer ${updatedToken}`;
      }
    }
    return reqConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);
