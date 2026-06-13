import { create } from 'zustand';
import { getKeycloakInstance } from '@/lib/keycloak';
import { api } from '@/lib/axios';
import { UserInfo, UserData, CreateAddressDto } from '@/types';

interface AuthState {
  initialized: boolean;
  authenticated: boolean;
  token: string | null;
  user: UserInfo | null;
  profile: UserData | null;
  setAuth: (authenticated: boolean, token: string | null, user: UserInfo | null) => void;
  setInitialized: (initialized: boolean) => void;
  login: (redirectUri?: string) => void;
  logout: (redirectUri?: string) => void;
  register: (redirectUri?: string) => void;
  refreshToken: (minValidity?: number) => Promise<boolean>;
  fetchProfile: () => Promise<UserData | null>;
  updateProfile: (formData: FormData) => Promise<boolean>;
  deleteProfile: () => Promise<boolean>;
  addAddress: (address: CreateAddressDto) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  authenticated: false,
  token: null,
  user: null,
  profile: null,
  setAuth: (authenticated, token, user) => set({ authenticated, token, user }),
  setInitialized: (initialized) => set({ initialized }),
  login: (redirectUri) => {
    const keycloak = getKeycloakInstance();
    if (keycloak) {
      keycloak.login({ redirectUri: redirectUri || window.location.origin });
    }
  },
  logout: (redirectUri) => {
    set({ profile: null });
    const keycloak = getKeycloakInstance();
    if (keycloak) {
      keycloak.logout({ redirectUri: redirectUri || window.location.origin });
    }
  },
  register: (redirectUri) => {
    const keycloak = getKeycloakInstance();
    if (keycloak) {
      keycloak.register({ redirectUri: redirectUri || window.location.origin });
    }
  },
  refreshToken: async (minValidity = 30) => {
    const keycloak = getKeycloakInstance();
    if (!keycloak) return false;
    try {
      const refreshed = await keycloak.updateToken(minValidity);
      if (refreshed) {
        const roles = (keycloak.tokenParsed?.['realm_access'] as any)?.roles ?? [];
        let primaryRole: 'ADMIN' | 'DRIVER' | 'CUSTOMER' | null = null;
        if (roles.includes('ADMIN')) primaryRole = 'ADMIN';
        else if (roles.includes('DRIVER')) primaryRole = 'DRIVER';
        else if (roles.includes('CUSTOMER')) primaryRole = 'CUSTOMER';

        const user: UserInfo = {
          id: keycloak.tokenParsed?.sub ?? '',
          username: keycloak.tokenParsed?.['preferred_username'] ?? '',
          email: keycloak.tokenParsed?.['email'] ?? '',
          name: keycloak.tokenParsed?.['name'] ?? '',
          roles,
          primaryRole,
          role: primaryRole as any,
        };
        set({ token: keycloak.token ?? null, user });
      }
      return true;
    } catch (error) {
      console.warn('[Keycloak] No se pudo refrescar el token:', error);
      return false;
    }
  },
  fetchProfile: async () => {
    const { authenticated, user } = get();
    if (!authenticated || !user) return null;

    try {
      // 1. Obtener datos de la base de datos local
      const userResponse = await api.get(`/api/users/${user.id}`);
      const backendUser = userResponse.data?.data;

      const enrichedUserInfo = {
        id: user.id,
        email: backendUser?.email || user.email,
        name: backendUser?.name || user.name,
        lastName: backendUser?.lastName || '',
        phone: backendUser?.phone || '',
        image: backendUser?.image || null,
        role: user.primaryRole as any,
      };

      let enrichedData: UserData = {
        user: enrichedUserInfo,
        driver: null,
        customer: null as any,
      };

      if (user.primaryRole === 'CUSTOMER') {
        try {
          const profileResp = await api.get('/api/customers/my-profile');
          enrichedData.customer = profileResp.data?.data || {
            id: 0,
            userId: 0,
            totalOrders: 0,
            addresses: [],
          };
        } catch (err) {
          // Si no existe, intentar crearlo
          try {
            const createResp = await api.post(
              `/api/customers/internal/create?userId=${user.id}&userEmail=${encodeURIComponent(
                enrichedUserInfo.email
              )}`
            );
            enrichedData.customer = createResp.data || {
              id: 0,
              userId: 0,
              totalOrders: 0,
              addresses: [],
            };
          } catch (createErr) {
            console.error('Error creating customer profile:', createErr);
            enrichedData.customer = { id: 0, userId: 0, totalOrders: 0, addresses: [] };
          }
        }
      } else if (user.primaryRole === 'DRIVER') {
        try {
          const profileResp = await api.get('/api/drivers/my-profile');
          enrichedData.driver = profileResp.data?.data;
        } catch (err) {
          console.error('Error fetching driver profile:', err);
        }
      }

      set({ profile: enrichedData });
      return enrichedData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  updateProfile: async (formData: FormData) => {
    const { user } = get();
    if (!user) return false;
    try {
      const response = await api.put(`/api/users/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data?.success) {
        await get().fetchProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  },
  deleteProfile: async () => {
    const { user } = get();
    if (!user) return false;
    try {
      const response = await api.delete(`/api/users/${user.id}`);
      if (response.data?.success) {
        get().logout();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  },
  addAddress: async (address: CreateAddressDto) => {
    try {
      const response = await api.post('/api/customers/my-profile/addresses', address);
      if (response.data?.success) {
        await get().fetchProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding address:', error);
      return false;
    }
  },
}));
