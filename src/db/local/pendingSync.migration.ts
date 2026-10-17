import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { OutboxOp, PendingRecord } from './local-document.types';
import { defaultLocalDeps, type LocalDeps } from './local.repository';
import { getLocalStore, type LocalStore } from './local.store';
import { enqueue } from './outbox.compaction';

/** Cola de verificaciones de antes de la outbox (features/checklist/pendingSync). */
const OLD_KEY = 'pending-verification-records';

interface OldEntry {
  userId: string;
  record: PendingRecord;
  queuedAt: string;
}

const isOldEntry = (value: unknown): value is OldEntry => {
  const entry = value as Partial<OldEntry> | null;
  return (
    typeof entry?.userId === 'string' &&
    typeof entry.queuedAt === 'string' &&
    typeof entry.record?.id === 'string' &&
    typeof entry.record.routineId === 'string' &&
    typeof entry.record.result === 'string'
  );
};

function readOldQueue(raw: string): OldEntry[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isOldEntry) : [];
  } catch {
    return []; // Corrupta: no se puede recuperar.
  }
}

/**
 * Una sola vez (y sin efecto después): pasa las verificaciones que esperaban en la cola vieja a la
 * outbox de su dueño, en el mismo orden, y borra la cola vieja. La outbox no duplica un mismo id.
 */
export async function migratePendingRecords(
  storage: KeyValueStorage = AsyncStorage,
  storeFor: (userId: string) => LocalStore = getLocalStore,
  deps: LocalDeps = defaultLocalDeps,
): Promise<void> {
  const raw = await storage.getItem(OLD_KEY);
  if (raw === null) return;

  const byOwner = new Map<string, OldEntry[]>();
  for (const entry of readOldQueue(raw)) {
    byOwner.set(entry.userId, [...(byOwner.get(entry.userId) ?? []), entry]);
  }

  for (const [userId, entries] of byOwner) {
    await storeFor(userId).update((doc) => {
      const outbox = entries.reduce<OutboxOp[]>(
        (pending, { record, queuedAt }) =>
          enqueue(pending, {
            kind: 'insertRecord',
            record,
            opId: deps.newId(),
            queuedAt,
            at: record.date ?? queuedAt,
            attempts: 0,
          }),
        doc.outbox,
      );
      return { doc: { ...doc, outbox }, result: undefined };
    });
  }
  await storage.removeItem(OLD_KEY);
}
