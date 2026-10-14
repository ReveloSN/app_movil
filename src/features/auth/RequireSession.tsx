import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { LoadingState } from '@/components/molecules/LoadingState';

import { useAuth } from './AuthProvider';

/** Guarda de rutas privadas: sin usuario redirige a login (sin red se sigue con el último usuario conocido). */
export function RequireSession({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return children;
}
