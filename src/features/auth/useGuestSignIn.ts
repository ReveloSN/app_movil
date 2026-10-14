import { useState } from 'react';

import { useAuth } from './AuthProvider';

/** Estado y envío de "Continuar sin cuenta". */
export function useGuestSignIn(onSuccess: () => void) {
  const { signInAsGuest } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    const result = await signInAsGuest();
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess();
  }

  return { start, submitting, error };
}
