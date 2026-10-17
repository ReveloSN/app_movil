import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createLocalRepositories, type LocalRepositories } from '@/db/local/local.repositories';
import { getLocalStore, type LocalStore } from '@/db/local/local.store';
import { useAuth } from '@/features/auth/AuthProvider';

interface LocalData {
  repositories: LocalRepositories;
  store: LocalStore;
}

const LocalDataContext = createContext<LocalData | null>(null);

const signedOut = () => Promise.reject(new Error('Sin sesión: no hay datos locales.'));

/** Sin usuario no hay documento local: cualquier uso falla (las pantallas ya lo evitan sin sesión). */
const signedOutStore: LocalStore = {
  userId: '',
  read: signedOut,
  update: signedOut,
  subscribe: () => () => undefined,
  clear: () => Promise.resolve(),
};

/** Entrega los repositorios local-first del usuario actual y su store; cambian al cambiar de sesión. */
export function LocalRepositoriesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const value = useMemo(() => {
    const store = userId ? getLocalStore(userId) : signedOutStore;
    return { store, repositories: createLocalRepositories(store) };
  }, [userId]);

  return <LocalDataContext.Provider value={value}>{children}</LocalDataContext.Provider>;
}

function useLocalData(): LocalData {
  const context = useContext(LocalDataContext);
  if (!context) {
    throw new Error('Los datos locales deben usarse dentro de <LocalRepositoriesProvider>.');
  }
  return context;
}

export const useLocalRepositories = (): LocalRepositories => useLocalData().repositories;

/** Para suscribirse a los cambios (ej. lo que trae la sincronización) o leer la outbox. */
export const useLocalStore = (): LocalStore => useLocalData().store;
