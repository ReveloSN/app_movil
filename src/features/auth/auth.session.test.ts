import { AuthApiError, AuthRetryableFetchError, type Session } from '@supabase/supabase-js';

import { nextUserForEvent, resolveStartupUser } from './auth.session';
import type { AuthUser } from './auth.types';

function fakeSession(user: { id: string; email?: string; is_anonymous?: boolean }): Session {
  return { access_token: 'token', user } as unknown as Session;
}

const LAST_KNOWN: AuthUser = { id: 'user-1', email: 'ana@example.com', isAnonymous: false };

describe('resolveStartupUser', () => {
  it('usa el usuario de la sesión cuando la hay', () => {
    const session = fakeSession({ id: 'user-2', email: 'luis@example.com' });

    expect(resolveStartupUser({ session, error: null }, LAST_KNOWN)).toEqual({
      id: 'user-2',
      email: 'luis@example.com',
      isAnonymous: false,
    });
  });

  it('marca como invitado al usuario anónimo, que no tiene correo', () => {
    const session = fakeSession({ id: 'guest-1', is_anonymous: true });

    expect(resolveStartupUser({ session, error: null }, null)).toEqual({
      id: 'guest-1',
      email: null,
      isAnonymous: true,
    });
  });

  it('sin red para renovar la sesión, sigue con el último usuario conocido', () => {
    const error = new AuthRetryableFetchError('Network request failed', 0);

    expect(resolveStartupUser({ session: null, error }, LAST_KNOWN)).toEqual(LAST_KNOWN);
  });

  it('sin red y sin último usuario conocido, no hay usuario', () => {
    const error = new AuthRetryableFetchError('Network request failed', 0);

    expect(resolveStartupUser({ session: null, error }, null)).toBeNull();
  });

  it('si Supabase no tiene sesión guardada, ignora el último usuario conocido', () => {
    expect(resolveStartupUser({ session: null, error: null }, LAST_KNOWN)).toBeNull();
  });

  it('si el servidor rechazó la sesión (no es un fallo de red), no hay usuario', () => {
    const error = new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found');

    expect(resolveStartupUser({ session: null, error }, LAST_KNOWN)).toBeNull();
  });
});

describe('nextUserForEvent', () => {
  it('al cerrar sesión no queda usuario', () => {
    expect(nextUserForEvent('SIGNED_OUT', null, LAST_KNOWN)).toBeNull();
  });

  it('un evento con sesión (ej. token renovado) toma el usuario de esa sesión', () => {
    const session = fakeSession({ id: 'user-1', email: 'ana@example.com' });

    expect(nextUserForEvent('TOKEN_REFRESHED', session, null)).toEqual(LAST_KNOWN);
  });

  it('la sesión inicial vacía por falta de red no saca al usuario actual', () => {
    expect(nextUserForEvent('INITIAL_SESSION', null, LAST_KNOWN)).toEqual(LAST_KNOWN);
  });
});
