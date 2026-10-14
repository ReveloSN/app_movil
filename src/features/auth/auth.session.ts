import { isAuthRetryableFetchError, type AuthChangeEvent, type Session } from '@supabase/supabase-js';

import type { AuthUser } from './auth.types';

export function toAuthUser(session: Session): AuthUser {
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    isAnonymous: session.user.is_anonymous ?? false,
  };
}

/**
 * Usuario al abrir la app. Si la sesión venció y no hay red para renovarla, Supabase responde
 * sin sesión pero la conserva guardada (la renueva solo al volver la conexión): mientras tanto
 * se sigue con el último usuario conocido en vez de mandar al login.
 */
export function resolveStartupUser(
  result: { session: Session | null; error: unknown },
  lastKnown: AuthUser | null,
): AuthUser | null {
  if (result.session) return toAuthUser(result.session);
  return isAuthRetryableFetchError(result.error) ? lastKnown : null;
}

/** Usuario tras un evento de Supabase Auth. Solo cerrar sesión lo quita: un evento sin sesión por falta de red, no. */
export function nextUserForEvent(
  event: AuthChangeEvent,
  session: Session | null,
  current: AuthUser | null,
): AuthUser | null {
  if (event === 'SIGNED_OUT') return null;
  return session ? toAuthUser(session) : current;
}
