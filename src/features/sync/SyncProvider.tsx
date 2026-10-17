import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { remoteRepositories } from '@/db/app.repositories';
import type { OutboxOp } from '@/db/local/local-document.types';
import { discardOutboxOp, previewDiscard, retryOutboxOp } from '@/db/local/outbox.actions';
import { createSyncEngine } from '@/db/sync/sync.engine';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import { showFlashMessage } from '@/shared/events/flashMessage';
import { useNetworkStatus } from '@/shared/network/useNetworkStatus';

import { SYNC_CONFLICT_MESSAGE, syncFailedMessage } from './sync.copy';
import { describeChange, failureReason } from './sync.describe';
import { summarizeOutbox } from './sync.status';

/** Cambio rechazado por el servidor, ya descrito para mostrarlo. */
export interface FailedChange {
  opId: string;
  title: string;
  reason: string;
}

interface SyncStatus {
  /** Cambios sin subir que no fallaron (incluye los bloqueados). */
  pendingCount: number;
  blockedCount: number;
  failedChanges: FailedChange[];
  /** ISO 8601 de la última bajada completa del servidor. */
  lastSyncedAt: string | null;
}

export interface SyncContextValue extends SyncStatus {
  syncing: boolean;
  syncNow(): void;
  retry(opId: string): Promise<void>;
  discard(opId: string): Promise<void>;
  /** Lo que se descartaría junto con `opId` (para avisarlo antes de confirmar). */
  previewDiscard(opId: string): Promise<OutboxOp[]>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

/** Espera tras un cambio local antes de subir: agrupa varios cambios seguidos (§2.3). */
const DEBOUNCE_MS = 1500;

const EMPTY_STATUS: SyncStatus = { pendingCount: 0, blockedCount: 0, failedChanges: [], lastSyncedAt: null };

const warn = (scope: string) => (cause: unknown) => {
  if (__DEV__) console.warn(`[sync.${scope}]`, cause);
};

/**
 * Cuándo sincronizar (§2.3): al abrir con sesión, al volver la conexión, al volver a primer plano y
 * tras cada cambio local (agrupado). Tras bajar algo nuevo, rearma los avisos. Con la app cerrada,
 * la tarea en segundo plano solo sube (trigger.maintenance).
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const store = useLocalStore();
  const { isConnected } = useNetworkStatus();
  const { rearm } = useTriggerRuntime();
  const [status, setStatus] = useState<SyncStatus>(EMPTY_STATUS);
  const [syncing, setSyncing] = useState(false);
  // Al cambiar de usuario se reinicia el estado durante el render: nunca se ven los pendientes de otra sesión.
  const [statusOwner, setStatusOwner] = useState(userId);
  if (statusOwner !== userId) {
    setStatusOwner(userId);
    setStatus(EMPTY_STATUS);
  }
  const connected = useRef(isConnected);
  useEffect(() => {
    connected.current = isConnected;
  });

  const engine = useMemo(() => (userId ? createSyncEngine(store, remoteRepositories) : null), [userId, store]);

  const refreshStatus = useCallback(() => {
    if (!userId) return;
    store
      .read()
      .then((doc) => {
        const { pendingCount, blockedCount, failed } = summarizeOutbox(doc.outbox);
        const failedChanges = failed.map((op) => ({
          opId: op.opId,
          title: describeChange(op, doc.tables),
          reason: failureReason(op.failed),
        }));
        setStatus({ pendingCount, blockedCount, failedChanges, lastSyncedAt: doc.lastPulledAt });
      })
      .catch(warn('status'));
  }, [store, userId]);

  const run = useCallback(() => {
    if (!engine || !connected.current) return;
    setSyncing(true);
    engine
      .sync()
      .then((report) => {
        if (report.push.stale.length > 0) showFlashMessage(SYNC_CONFLICT_MESSAGE);
        else if (report.push.failed.length > 0) showFlashMessage(syncFailedMessage(report.push.failed.length));
        if (report.changed) rearm().catch(warn('rearm'));
      })
      .catch(warn('run'))
      .finally(() => setSyncing(false));
  }, [engine, rearm]);

  // Al abrir con sesión (la conexión arranca en true) y cada vez que vuelve.
  useEffect(() => {
    if (isConnected) run();
  }, [isConnected, run]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => subscription.remove();
  }, [run]);

  // Estado siempre al día; y tras un cambio hecho por la persona, subir (agrupado).
  useEffect(() => {
    if (!userId) return;
    refreshStatus();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = store.subscribe((change) => {
      refreshStatus();
      if (change.source === 'local' && change.outboxChanged) {
        clearTimeout(timer);
        timer = setTimeout(run, DEBOUNCE_MS);
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [store, userId, run, refreshStatus]);

  const value = useMemo<SyncContextValue>(
    () => ({
      ...status,
      syncing,
      syncNow: run,
      retry: (opId) => retryOutboxOp(store, opId),
      discard: (opId) => discardOutboxOp(store, opId).then(() => undefined),
      previewDiscard: (opId) => previewDiscard(store, opId),
    }),
    [status, syncing, run, store],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync debe usarse dentro de <SyncProvider>.');
  return context;
}
