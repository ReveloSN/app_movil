import { useCallback, useEffect, useRef, useState } from 'react';

import type { HomeNetworkRepository } from '@/db/repositories/home-network.repository';
import type { TriggerRepository } from '@/db/repositories/trigger.repository';
import { useLocalRepositories, useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import { NETWORK_NAME_MAX_LENGTH } from '@/features/triggers/trigger.validation';
import { loadNetworkLastSeen } from '@/features/triggers/wifi/networkLastSeen.store';
import type { HomeNetwork } from '@/shared/types/home-network.types';

import { NETWORK_SAVE_ERROR, NETWORKS_LOAD_ERROR } from './settings.copy';

export interface HomeNetworkView extends HomeNetwork {
  /** Avisos que apuntan a esta red: con alguno, no se puede eliminar. */
  usedBy: number;
  /** Última vez que este teléfono estuvo conectado (epoch ms), si se sabe. */
  lastSeenAt: number | null;
}

interface Deps {
  homeNetworks: Pick<HomeNetworkRepository, 'getAll' | 'update' | 'delete'>;
  triggers: Pick<TriggerRepository, 'getAll'>;
}

/** Valida el nombre visible de una red. null si es válido. */
export function validateNetworkName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Ponle un nombre a la red (ej. Casa).';
  if (trimmed.length > NETWORK_NAME_MAX_LENGTH) return `Máximo ${NETWORK_NAME_MAX_LENGTH} caracteres.`;
  return null;
}

/** Redes de casa (11-1): lista con uso y última conexión; renombrar y eliminar. */
export function useHomeNetworks(injected?: Deps) {
  const local = useLocalRepositories();
  const store = useLocalStore();
  const deps = injected ?? local;
  const { rearm } = useTriggerRuntime();
  const [networks, setNetworks] = useState<HomeNetworkView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback((): Promise<void> => {
    const request = ++latestRequest.current;
    return Promise.all([deps.homeNetworks.getAll(), deps.triggers.getAll(), loadNetworkLastSeen()]).then(
      ([rows, triggers, lastSeen]) => {
        if (request !== latestRequest.current) return;
        setNetworks(
          rows.map((network) => ({
            ...network,
            usedBy: triggers.filter((trigger) => trigger.networkId === network.id).length,
            lastSeenAt: lastSeen[network.ssid] ?? null,
          })),
        );
        setError(null);
        setLoading(false);
      },
      (cause: unknown) => {
        if (request !== latestRequest.current) return;
        if (__DEV__) console.warn('[homeNetworks.load]', cause);
        setError(NETWORKS_LOAD_ERROR);
        setLoading(false);
      },
    );
  }, [deps]);

  useEffect(() => {
    void load();
  }, [load]);

  // Redes que llegan o cambian desde otro dispositivo (al sincronizar).
  useEffect(
    () =>
      store.subscribe((change) => {
        if (change.source === 'sync' && change.tablesChanged) void load();
      }),
    [store, load],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  /** Devuelve true si se guardó. El nombre nuevo también cambia el texto de las notificaciones. */
  const rename = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setActionError(null);
      try {
        const updated = await deps.homeNetworks.update(id, { displayName: name.trim() });
        setNetworks((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
        rearm().catch(() => undefined);
        return true;
      } catch (cause) {
        if (__DEV__) console.warn('[homeNetworks.rename]', cause);
        setActionError(NETWORK_SAVE_ERROR);
        return false;
      }
    },
    [deps, rearm],
  );

  /** Solo redes sin avisos: la pantalla lo impide antes de llamar. */
  const remove = useCallback(
    async (id: string): Promise<void> => {
      setActionError(null);
      try {
        await deps.homeNetworks.delete(id);
        setNetworks((current) => current.filter((item) => item.id !== id));
      } catch (cause) {
        if (__DEV__) console.warn('[homeNetworks.delete]', cause);
        setActionError(NETWORK_SAVE_ERROR);
      }
    },
    [deps],
  );

  return { networks, loading, error, actionError, refresh, rename, remove };
}
