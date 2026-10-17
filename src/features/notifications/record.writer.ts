import * as Crypto from 'expo-crypto';

import { createLocalRepositories, type LocalRepositories } from '@/db/local/local.repositories';
import { getLocalStore } from '@/db/local/local.store';

/** Resultados que se registran desde una notificación, sin pasar por la verificación (P07). */
export type NotificationOutcome = 'skipped' | 'no_response';

/**
 * Crea el registro sin abrir la app (también desde la tarea en segundo plano): va a la cola local del
 * dueño de los avisos y se sube cuando haya sincronización.
 */
export async function writeNotificationRecord(
  routineId: string,
  ownerId: string,
  result: NotificationOutcome,
  at: number,
  repository: Pick<LocalRepositories['records'], 'create'> = createLocalRepositories(getLocalStore(ownerId)).records,
): Promise<void> {
  await repository.create({
    id: Crypto.randomUUID(),
    routineId,
    result,
    date: new Date(at).toISOString(),
    itemsChecked: null,
    durationSeconds: null,
  });
}
