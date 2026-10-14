import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase as defaultClient } from '@/shared/lib/supabase';

import { toAuthErrorMessage, toGuestErrorMessage } from './auth.errors';
import { nextUserForEvent, resolveStartupUser, toAuthUser } from './auth.session';
import type { AuthContextValue, AuthUser, Credentials } from './auth.types';
import { clearLastUser, loadLastUser, saveLastUser } from './lastUser.store';

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  /** Inyectable para tests; por defecto el cliente de la app. */
  client?: SupabaseClient;
}

const warn = (scope: string) => (cause: unknown) => {
  if (__DEV__) console.warn(`[auth.${scope}]`, cause);
};

export function AuthProvider({ children, client = defaultClient }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([client.auth.getSession(), loadLastUser().catch(() => null)])
      .then(([{ data, error }, lastKnown]) => {
        if (mounted) setUser(resolveStartupUser({ session: data.session, error }, lastKnown));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
      setUser((current) => nextUserForEvent(event, nextSession, current));
      // Se recuerda quién tenía sesión para poder seguir sin conexión la próxima vez.
      if (event === 'SIGNED_OUT') clearLastUser().catch(warn('clearLastUser'));
      else if (nextSession) saveLastUser(toAuthUser(nextSession)).catch(warn('saveLastUser'));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  // El refresco automático del token solo debe correr con la app en primer plano. Al volver la
  // conexión, renueva la sesión que no se pudo renovar sin red.
  useEffect(() => {
    if (AppState.currentState === 'active') client.auth.startAutoRefresh();
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

  const signInAsGuest = useCallback(async () => {
    const { error } = await client.auth.signInAnonymously();
    return { error: error ? toGuestErrorMessage(error) : null };
  }, [client]);

  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut();
    return { error: error ? toAuthErrorMessage(error) : null };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, signInAsGuest, signOut }),
    [user, loading, signIn, signUp, signInAsGuest, signOut],
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
