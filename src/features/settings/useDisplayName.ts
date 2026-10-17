import { useCallback, useEffect, useState } from 'react';

import type { SettingsRepository } from '@/db/repositories/settings.repository';
import { useLocalRepositories, useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';

/**
 * Nombre de Ajustes desde la copia local (sin red). Se relee con cualquier cambio de los datos:
 * el que se escribe en Ajustes o el que trae la sincronización.
 */
export function useDisplayName(injected?: Pick<SettingsRepository, 'getAll'>): string | null {
  const local = useLocalRepositories();
  const store = useLocalStore();
  const repository = injected ?? local.settings;
  const [name, setName] = useState<string | null>(null);

  const load = useCallback(() => {
    repository.getAll().then(
      ([row]) => setName(row?.displayName ?? null),
      (cause: unknown) => {
        if (__DEV__) console.warn('[settings.displayName]', cause);
      },
    );
  }, [repository]);

  useEffect(() => {
    load();
    return store.subscribe((change) => {
      if (change.tablesChanged) load();
    });
  }, [store, load]);

  return name;
}
