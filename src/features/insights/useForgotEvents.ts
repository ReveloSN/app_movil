import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';

import { createForgotStore } from './insights.stores';

/** Ítems anotados con "Olvidé algo" en una verificación (solo los de este teléfono). */
export function useForgotLabels(recordId: string): string[] {
  const { user } = useAuth();
  const [labels, setLabels] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    createForgotStore(user.id)
      .getAll()
      .then(
        (events) => {
          if (active) setLabels(events.filter((event) => event.recordId === recordId).map((event) => event.label));
        },
        (cause: unknown) => {
          if (__DEV__) console.warn('[insights.forgot.read]', cause);
        },
      );
    return () => {
      active = false;
    };
  }, [user, recordId]);
  return labels;
}
