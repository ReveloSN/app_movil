import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

const MESSAGES_BY_CODE: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión.',
  user_already_exists: 'Ya existe una cuenta con ese correo.',
  email_exists: 'Ya existe una cuenta con ese correo.',
  weak_password: 'La contraseña es demasiado débil.',
  over_request_rate_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  anonymous_provider_disabled: 'El acceso sin cuenta no está disponible en este momento.',
};

const FALLBACK_MESSAGE = 'No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.';

const GUEST_OFFLINE_MESSAGE =
  'La primera vez necesitas internet para crear tu espacio. Después la app funciona sin conexión.';

/** Traduce un error de Supabase Auth a un mensaje para el usuario. */
export function toAuthErrorMessage(error: AuthError): string {
  return (error.code && MESSAGES_BY_CODE[error.code]) || FALLBACK_MESSAGE;
}

/** Como toAuthErrorMessage, pero sin red explica que el invitado solo necesita internet la primera vez. */
export function toGuestErrorMessage(error: AuthError): string {
  return isAuthRetryableFetchError(error) ? GUEST_OFFLINE_MESSAGE : toAuthErrorMessage(error);
}
