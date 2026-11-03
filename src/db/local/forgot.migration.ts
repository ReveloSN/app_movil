import AsyncStorage from '@react-native-async-storage/async-storage';

import { FORGOT_LABEL_MAX_LENGTH, type ForgotEvent } from '@/shared/types/forgot-event.types';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import { addForgotEvents } from './forgot.events';
import type { OutboxOp } from './local-document.types';
import { defaultLocalDeps, type LocalDeps } from './local.repository';
import { getLocalStore, type LocalStore } from './local.store';
import { enqueue } from './outbox.compaction';

/** Olvidos de antes, que vivían solo en este teléfono (features/insights/insights.stores.ts). */
export const oldForgotKey = (userId: string) => `forgot-events:${userId}`;

const isOldEvent = (value: unknown): value is ForgotEvent => {
  const event = value as Partial<ForgotEvent> | null;
  return (
    typeof event?.id === 'string' &&
    typeof event.routineId === 'string' &&
    (event.recordId === null || event.recordId === undefined || typeof event.recordId === 'string') &&
    typeof event.label === 'string' &&
    event.label.trim().length > 0 &&
    event.label.trim().length <= FORGOT_LABEL_MAX_LENGTH &&
    typeof event.date === 'string' &&
    !Number.isNaN(Date.parse(event.date))
  );
};

function readOldEvents(raw: string): ForgotEvent[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isOldEvent).map((event) => ({
      id: event.id,
      routineId: event.routineId,
      recordId: event.recordId ?? null,
      label: event.label.trim(),
      date: event.date,
    }));
  } catch {
    return []; // Corrupta: no se puede recuperar.
  }
}

/**
 * Pasa los olvidos de un usuario que estaban solo en este teléfono a su documento local y los encola
 * para subir (del más viejo al más nuevo). Se descartan los de rutinas que ya no existen. Idempotente:
 * lo que ya está en el documento no se vuelve a encolar. Al final borra la clave vieja, salvo que
 * alguien haya escrito en ella mientras tanto (entonces la próxima vez se termina).
 */
export async function migrateForgotEvents(
  userId: string,
  storage: KeyValueStorage = AsyncStorage,
  storeFor: (userId: string) => LocalStore = getLocalStore,
  deps: LocalDeps = defaultLocalDeps,
): Promise<void> {
  const key = oldForgotKey(userId);
  const raw = await storage.getItem(key);
  if (raw === null) return;

  const old = readOldEvents(raw).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (old.length > 0) {
    const queuedAt = deps.now();
    await storeFor(userId).update((doc) => {
      const routines = new Set(doc.tables.routines.map((routine) => routine.id));
      const known = new Set((doc.forgotEvents ?? []).map((event) => event.id));
      const fresh = old.filter((event) => routines.has(event.routineId) && !known.has(event.id));
      if (fresh.length === 0) return { doc, result: undefined };

      const outbox = fresh.reduce<OutboxOp[]>(
        (pending, event) =>
          enqueue(pending, { kind: 'insertForgot', event, opId: deps.newId(), queuedAt, at: event.date, attempts: 0 }),
        doc.outbox,
      );
      return { doc: { ...doc, outbox, forgotEvents: addForgotEvents(doc.forgotEvents ?? [], fresh) }, result: undefined };
    });
  }

  if ((await storage.getItem(key)) === raw) await storage.removeItem(key);
}
