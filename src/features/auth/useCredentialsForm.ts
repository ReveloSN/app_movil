import { useState } from 'react';

import type { AuthResult, Credentials } from './auth.types';
import { validateCredentials, type CredentialErrors } from './auth.validation';

interface UseCredentialsFormOptions<R extends AuthResult> {
  enforcePasswordLength: boolean;
  /** Acción de autenticación a ejecutar (signIn o signUp). */
  submitAction(credentials: Credentials): Promise<R>;
  /** Se llama solo si la acción terminó sin error. */
  onSuccess(result: R): void;
}

/** Estado, validación y envío de un formulario de correo + contraseña. */
export function useCredentialsForm<R extends AuthResult>({
  enforcePasswordLength,
  submitAction,
  onSuccess,
}: UseCredentialsFormOptions<R>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CredentialErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;

    const credentials = { email, password };
    const errors = validateCredentials(credentials, { enforcePasswordLength });
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const result = await submitAction(credentials);
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }
    onSuccess(result);
  }

  return { email, setEmail, password, setPassword, fieldErrors, formError, submitting, submit };
}
