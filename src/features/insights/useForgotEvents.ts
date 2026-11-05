import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useLocalRepositories, useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';

import { ensureForgotMigrated } from './forgot.migrate';

/** Ítems anotados con "Olvidé algo" en una verificación (de la copia local, sincronizada). */
export function useForgotLabels(recordId: string): string[] {
  const { user } = useAuth();
  const local = useLocalRepositories();
  const store = useLocalStore();
  const [labels, setLabels] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    ensureForgotMigrated(user.id, store)
      .then(() => local.forgotEvents.getAll())
      .then(
        (events) => {
          // getAll viene del más reciente al más antiguo: se muestran en el orden en que se anotaron.
          if (active) setLabels(events.filter((event) => event.recordId === recordId).map((event) => event.label).reverse());
        },
        (cause: unknown) => {
          if (__DEV__) console.warn('[insights.forgot.read]', cause);
        },
      );
    return () => {
      active = false;
    };
  }, [user, local, store, recordId]);
  return labels;
}
