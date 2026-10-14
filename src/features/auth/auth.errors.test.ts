import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { toGuestErrorMessage } from './auth.errors';

describe('toGuestErrorMessage', () => {
  it('sin red explica que la primera vez hace falta internet', () => {
    const error = new AuthRetryableFetchError('Network request failed', 0);

    expect(toGuestErrorMessage(error)).toBe(
      'La primera vez necesitas internet para crear tu espacio. Después la app funciona sin conexión.',
    );
  });

  it('si el acceso anónimo está desactivado en Supabase, lo dice', () => {
    const error = new AuthApiError('Anonymous sign-ins are disabled', 422, 'anonymous_provider_disabled');

    expect(toGuestErrorMessage(error)).toBe('El acceso sin cuenta no está disponible en este momento.');
  });

  it('cualquier otro error usa el mensaje general', () => {
    const error = new AuthApiError('Request rate limit reached', 429, 'over_request_rate_limit');

    expect(toGuestErrorMessage(error)).toBe('Demasiados intentos. Espera un momento e inténtalo de nuevo.');
  });
});
