import { useCallback, useEffect, useRef, useState } from 'react';

import type { LocalDocument } from '@/db/local/local-document.types';
import type { LocalStore } from '@/db/local/local.store';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';
import { useRoutines } from '@/features/routines/useRoutines';
import { useSync } from '@/features/sync/SyncProvider';

import { withPendingRecords, type HistoryRecord } from './history.pending';

const LOAD_ERROR = 'No pudimos leer tu historial en este teléfono. Inténtalo de nuevo.';

export interface HistoryData {
  /** Del historial local, con `pending` si la verificación aún espera en la cola. */
  records: HistoryRecord[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
}

const recordsOf = (doc: LocalDocument) => withPendingRecords(doc.records ?? [], doc.outbox);

/**
 * Historial del usuario desde la copia local (funciona sin red): lo bajado del servidor más lo
 * verificado aquí. Se actualiza solo al terminar una verificación y tras cada sincronización;
 * "refrescar" pide una sincronización.
 */
export function useHistory(injectedStore?: Pick<LocalStore, 'read' | 'subscribe'>): HistoryData {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const localStore = useLocalStore();
  const store = injectedStore ?? localStore;
  const { syncNow } = useSync();
  const { refresh: refreshRoutines } = useRoutines();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(userId !== null);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  // Al cambiar de usuario se reinicia el estado durante el render: nunca se ve el historial de otra sesión.
  const [stateOwner, setStateOwner] = useState(userId);
  if (stateOwner !== userId) {
    setStateOwner(userId);
    setRecords([]);
    setError(null);
    setLoading(userId !== null);
  }

  const load = useCallback((): Promise<void> => {
    const request = ++latestRequest.current;
    return store.read().then(
      (doc) => {
        if (request !== latestRequest.current) return;
        setRecords(recordsOf(doc));
        setError(null);
        setLoading(false);
      },
      (cause: unknown) => {
        if (request !== latestRequest.current) return;
        if (__DEV__) console.warn('[history.load]', cause);
        setError(LOAD_ERROR);
        setLoading(false);
      },
    );
  }, [store]);

  useEffect(() => {
    if (!userId) return;
    void load();
    return store.subscribe((change) => {
      if (change.recordsChanged || change.outboxChanged) void load();
    });
  }, [store, userId, load]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    syncNow(); // Si hay red, trae lo de otros dispositivos; el resultado llega por la suscripción.
    await Promise.all([load(), refreshRoutines()]);
  }, [userId, syncNow, load, refreshRoutines]);

  return { records, loading, error, refresh };
}
