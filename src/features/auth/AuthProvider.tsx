import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase as defaultClient } from '@/shared/lib/supabase';

import { toAuthErrorMessage } from './auth.errors';
import type { AuthContextValue, Credentials } from './auth.types';

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  /** Inyectable para tests; por defecto el cliente de la app. */
  client?: SupabaseClient;
}

export function AuthProvider({ children, client = defaultClient }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    client.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  // El refresco automático del token solo debe correr con la app en primer plano.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, [client]);

  const signIn = useCallback(
    async ({ email, password }: Credentials) => {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error ? toAuthErrorMessage(error) : null };
    },
    [client],
  );

  const signUp = useCallback(
    async ({ email, password }: Credentials) => {
      const { data, error } = await client.auth.signUp({ email: email.trim(), password });
      if (error) return { error: toAuthErrorMessage(error), needsEmailConfirmation: false };
      return { error: null, needsEmailConfirmation: data.session === null };
    },
    [client],
  );

  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut();
    return { error: error ? toAuthErrorMessage(error) : null };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, loading, signIn, signUp, signOut }),
    [session, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
