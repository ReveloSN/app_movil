import type { LocalDocument } from '../local/local-document.types';
import type { LocalStore } from '../local/local.store';
import { isNetworkError } from '../repositories/repository.types';
import type { ForgotEvent } from '@/shared/types/forgot-event.types';

import { mergeForgotEvents, sameForgotEvents } from './sync.forgot';
import { mergePulled, type RemoteTables } from './sync.merge';
import { mergeRecords, sameRecords } from './sync.records';
import { pushOutbox, type PushReport, type RemoteDeps } from './sync.push';

export interface SyncReport {
  push: PushReport;
  /** Se bajó todo del servidor (solo si el push no se cortó por la red). */
  pulled: boolean;
  /** Lo bajado cambió las tablas locales: hay que refrescar pantallas y rearmar avisos. */
  changed: boolean;
}

export interface SyncEngine {
  /** Sube y luego baja. Si ya está corriendo, se repite una vez al terminar y se espera ese resultado. */
  sync(): Promise<SyncReport>;
}

/** Igual que con el historial: si no cambió, se conserva el mismo arreglo para no avisar a nadie. */
function mergeForgot(current: ForgotEvent[] | undefined, remote: ForgotEvent[], outbox: LocalDocument['outbox']) {
  const merged = mergeForgotEvents(current ?? [], remote, outbox);
  return current && sameForgotEvents(current, merged) ? current : merged;
}

async function fetchRemoteTables(remote: RemoteDeps): Promise<RemoteTables> {
  const [routines, items, triggers, homeNetworks, settings] = await Promise.all([
    remote.routines.getAll(),
    remote.items.getAll(),
    remote.triggers.getAll(),
    remote.homeNetworks.getAll(),
    remote.settings.getAll(),
  ]);
  return { routines, items, triggers, homeNetworks, settings };
}

/**
 * Olvidos del servidor. null si el servidor los rechaza por otra cosa que la red (ej. todavía no tiene
 * la tabla forgot_events): entonces no se tocan los locales y el resto de la bajada sigue.
 */
const fetchRemoteForgotEvents = (remote: RemoteDeps): Promise<ForgotEvent[] | null> =>
  remote.forgotEvents.getAll().catch((cause: unknown) => {
    if (isNetworkError(cause)) throw cause;
    return null;
  });

/** Sincronización de un usuario (§2.3): una a la vez; lo que se pide mientras corre se hace una vez más. */
export function createSyncEngine(
  store: LocalStore,
  remote: RemoteDeps,
  now: () => Date = () => new Date(),
): SyncEngine {
  let running: Promise<SyncReport> | null = null;
  let again = false;

  async function runOnce(): Promise<SyncReport> {
    const push = await pushOutbox(store, remote, now);
    if (push.offline) return { push, pulled: false, changed: false };

    let snapshot: RemoteTables;
    let remoteRecords: Awaited<ReturnType<RemoteDeps['records']['getAll']>>;
    let remoteForgot: ForgotEvent[] | null;
    try {
      [snapshot, remoteRecords, remoteForgot] = await Promise.all([
        fetchRemoteTables(remote),
        remote.records.getAll(),
        fetchRemoteForgotEvents(remote),
      ]);
    } catch (cause) {
      if (isNetworkError(cause)) return { push, pulled: false, changed: false };
      throw cause;
    }

    const changed = await store.update((doc) => {
      const tables = mergePulled(doc, snapshot);
      const local = doc.records ?? [];
      const merged = mergeRecords(local, remoteRecords, doc.outbox);
      // Mismo historial: se conserva el mismo arreglo para no avisar a nadie.
      const records = doc.records && sameRecords(local, merged) ? doc.records : merged;
      const forgotEvents = remoteForgot ? mergeForgot(doc.forgotEvents, remoteForgot, doc.outbox) : doc.forgotEvents;
      return {
        doc: { ...doc, tables, records, forgotEvents, lastPulledAt: now().toISOString() },
        result: tables !== doc.tables,
      };
    }, 'sync');
    return { push, pulled: true, changed };
  }

  async function loop(): Promise<SyncReport> {
    let report: SyncReport;
    do {
      again = false;
      report = await runOnce();
    } while (again);
    return report;
  }

  return {
    sync() {
      if (running) {
        again = true;
        return running;
      }
      running = loop().finally(() => {
        running = null;
      });
      return running;
    },
  };
}
