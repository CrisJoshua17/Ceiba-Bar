"use client";

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getKeycloakInstance } from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';
import { UserInfo } from '@/types';
import { Toaster } from '@/components/ui/sonner';

// Keep track of the initialization promise globally to prevent double init in React StrictMode
let initPromise: Promise<boolean> | null = null;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const { setAuth, setInitialized } = useAuthStore();

  useEffect(() => {
    const keycloak = getKeycloakInstance();
    if (!keycloak) return;

    const handleAuthSuccess = () => {
      if (keycloak.authenticated) {
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

        setAuth(true, keycloak.token ?? null, user);
        useAuthStore.getState().fetchProfile();
      } else {
        setAuth(false, null, null);
      }
    };

    const initKeycloak = async () => {
      if (initPromise) {
        try {
          await initPromise;
          handleAuthSuccess();
        } catch (e) {
          console.error('[Keycloak] Error waiting for initial init:', e);
        }
        setInitialized(true);
        return;
      }

      try {
        initPromise = keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri:
            typeof window !== 'undefined'
              ? window.location.origin + '/silent-check-sso.html'
              : undefined,
          checkLoginIframe: false,
        });

        await initPromise;
        handleAuthSuccess();
      } catch (error) {
        console.error('[Keycloak] Error during initialization:', error);
        initPromise = null;
      } finally {
        setInitialized(true);
      }
    };

    initKeycloak();
  }, [setAuth, setInitialized]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
