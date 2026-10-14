import { sessionStorage } from '@/shared/lib/sessionStorage';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { AuthUser } from './auth.types';

const STORAGE_KEY = 'auth-last-user';

const isAuthUser = (value: unknown): value is AuthUser => {
  const user = value as Partial<AuthUser> | null;
  return (
    typeof user?.id === 'string' &&
    (typeof user.email === 'string' || user.email === null) &&
    typeof user.isAnonymous === 'boolean'
  );
};

/**
 * Último usuario con sesión, para seguir sin conexión cuando la sesión no se puede renovar.
 * Por defecto va donde la sesión de Supabase (SecureStore): incluye el correo.
 */
export async function loadLastUser(storage: KeyValueStorage = sessionStorage): Promise<AuthUser | null> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAuthUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const saveLastUser = (user: AuthUser, storage: KeyValueStorage = sessionStorage) =>
  storage.setItem(STORAGE_KEY, JSON.stringify(user));

export const clearLastUser = (storage: KeyValueStorage = sessionStorage) => storage.removeItem(STORAGE_KEY);
