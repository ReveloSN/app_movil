import copy from './auth.copy';
import type { Credentials } from './auth.types';

export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

interface ValidationOptions {
  /** En registro se exige longitud mínima; en login solo que no esté vacía. */
  enforcePasswordLength: boolean;
}

export function validateCredentials(
  { email, password }: Credentials,
  { enforcePasswordLength }: ValidationOptions,
): CredentialErrors {
  const errors: CredentialErrors = {};

  if (!email.trim()) {
    errors.email = copy.EMAIL_REQUIRED;
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = copy.EMAIL_INVALID;
  }

  if (!password) {
    errors.password = copy.PASSWORD_REQUIRED;
  } else if (enforcePasswordLength && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = copy.passwordTooShort(MIN_PASSWORD_LENGTH);
  }

  return errors;
}
