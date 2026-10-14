import AsyncStorage from '@react-native-async-storage/async-storage';

import { isNetworkError, RepositoryError } from '@/db/repositories/repository.types';
import type { VerificationRecordRepository } from '@/db/repositories/verification-record.repository';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';
import type { CreateVerificationRecordInput } from '@/shared/types/verification-record.types';

const STORAGE_KEY = 'pending-verification-records';

/** El id lo genera el cliente: reintentar nunca duplica el registro. */
export type PendingRecord = CreateVerificationRecordInput & { id: string };

interface PendingEntry {
  /** Dueño del registro: solo se envía con su sesión (RLS lo rechazaría con otra cuenta). */
  userId: string;
  record: PendingRecord;
  queuedAt: string;
}

export interface FlushResult {
  saved: number;
  /** Rechazados por el servidor por un motivo permanente (no de red): se descartan. */
  dropped: number;
  remaining: number;
}

// Todas las operaciones sobre la cola van en serie: un enqueue durante un flush no se pierde.
let queueTail: Promise<unknown> = Promise.resolve();
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = queueTail.then(task, task);
  queueTail = run.catch(() => undefined);
  return run;
}

const isPendingEntry = (value: unknown): value is PendingEntry => {
  const entry = value as Partial<PendingEntry> | null;
  return (
    typeof entry?.userId === 'string' &&
    typeof entry.record?.id === 'string' &&
    typeof entry.record.routineId === 'string' &&
    typeof entry.record.result === 'string'
  );
};

async function readQueue(storage: KeyValueStorage): Promise<PendingEntry[]> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPendingEntry) : [];
  } catch {
    return []; // Contenido corrupto: no se puede recuperar.
  }
}

async function writeQueue(storage: KeyValueStorage, entries: PendingEntry[]): Promise<void> {
  if (entries.length === 0) await storage.removeItem(STORAGE_KEY);
  else await storage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Guarda un registro para enviarlo cuando vuelva la conexión. */
export function enqueue(userId: string, record: PendingRecord, storage: KeyValueStorage = AsyncStorage): Promise<void> {
  return serialized(async () => {
    const entries = await readQueue(storage);
    if (entries.some((entry) => entry.record.id === record.id)) return;
    await writeQueue(storage, [...entries, { userId, record, queuedAt: new Date().toISOString() }]);
  });
}

/** Intenta enviar los pendientes de `userId`; quita de la cola los que se guardaron. */
export function flush(
  userId: string,
  repository: Pick<VerificationRecordRepository, 'create'>,
  storage: KeyValueStorage = AsyncStorage,
): Promise<FlushResult> {
  return serialized(async () => {
    const entries = await readQueue(storage);
    const remaining: PendingEntry[] = [];
    let saved = 0;
    let dropped = 0;
    let offline = false;

    for (const entry of entries) {
      // De otra cuenta, o la red ya falló en esta pasada: se conserva sin intentar.
      if (entry.userId !== userId || offline) {
        remaining.push(entry);
        continue;
      }
      try {
        await repository.create(entry.record);
        saved += 1;
      } catch (cause) {
        if (cause instanceof RepositoryError && cause.kind === 'conflict') {
          saved += 1; // Ya estaba guardado (el intento anterior llegó al servidor).
        } else if (isNetworkError(cause)) {
          offline = true;
          remaining.push(entry);
        } else {
          dropped += 1;
          if (__DEV__) console.warn('[pendingSync] registro descartado', cause);
        }
      }
    }

    await writeQueue(storage, remaining);
    return { saved, dropped, remaining: remaining.length };
  });
}
