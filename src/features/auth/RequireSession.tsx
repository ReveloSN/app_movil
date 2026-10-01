import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { LoadingState } from '@/components/molecules/LoadingState';

import { useAuth } from './AuthProvider';

/** Guarda de rutas privadas: sin sesión redirige a login. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return children;
}
