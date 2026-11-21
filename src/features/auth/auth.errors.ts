import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

import copy from './auth.copy';

/** Clave del texto (en auth.copy) que explica cada código de error de Supabase Auth. */
const MESSAGE_KEY_BY_CODE = {
  invalid_credentials: 'ERROR_INVALID_CREDENTIALS',
  email_not_confirmed: 'ERROR_EMAIL_NOT_CONFIRMED',
  user_already_exists: 'ERROR_ACCOUNT_EXISTS',
  email_exists: 'ERROR_ACCOUNT_EXISTS',
  weak_password: 'ERROR_WEAK_PASSWORD',
  over_request_rate_limit: 'ERROR_RATE_LIMIT',
  over_email_send_rate_limit: 'ERROR_RATE_LIMIT',
  anonymous_provider_disabled: 'ERROR_ANONYMOUS_DISABLED',
} as const;

const isKnownCode = (code: string): code is keyof typeof MESSAGE_KEY_BY_CODE =>
  Object.prototype.hasOwnProperty.call(MESSAGE_KEY_BY_CODE, code);

/** Traduce un error de Supabase Auth a un mensaje para el usuario (en el idioma activo). */
export function toAuthErrorMessage(error: AuthError): string {
  return error.code && isKnownCode(error.code) ? copy[MESSAGE_KEY_BY_CODE[error.code]] : copy.ERROR_FALLBACK;
}

/** Como toAuthErrorMessage, pero sin red explica que el invitado solo necesita internet la primera vez. */
export function toGuestErrorMessage(error: AuthError): string {
  return isAuthRetryableFetchError(error) ? copy.ERROR_GUEST_OFFLINE : toAuthErrorMessage(error);
}
