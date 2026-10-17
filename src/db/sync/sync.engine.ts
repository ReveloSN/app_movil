import type { LocalTables } from '../local/local-document.types';
import type { LocalStore } from '../local/local.store';
import { isNetworkError } from '../repositories/repository.types';
import { mergePulled } from './sync.merge';
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

async function fetchRemoteTables(remote: RemoteDeps): Promise<LocalTables> {
  const [routines, items, triggers, homeNetworks, settings] = await Promise.all([
    remote.routines.getAll(),
    remote.items.getAll(),
    remote.triggers.getAll(),
    remote.homeNetworks.getAll(),
    remote.settings.getAll(),
  ]);
  return { routines, items, triggers, homeNetworks, settings };
}

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

    let snapshot: LocalTables;
    let remoteRecords: Awaited<ReturnType<RemoteDeps['records']['getAll']>>;
    try {
      [snapshot, remoteRecords] = await Promise.all([fetchRemoteTables(remote), remote.records.getAll()]);
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
      return { doc: { ...doc, tables, records, lastPulledAt: now().toISOString() }, result: tables !== doc.tables };
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
