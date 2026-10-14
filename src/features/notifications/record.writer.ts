import * as Crypto from 'expo-crypto';

import { appRepositories } from '@/db/app.repositories';
import { isNetworkError } from '@/db/repositories/repository.types';
import type { VerificationRecordRepository } from '@/db/repositories/verification-record.repository';
import { enqueue, type PendingRecord } from '@/features/checklist/pendingSync';

/** Resultados que se registran desde una notificación, sin pasar por la verificación (P07). */
export type NotificationOutcome = 'skipped' | 'no_response';

/**
 * Crea el registro sin abrir la app. Sin red, queda en la cola de pendientes (la misma de P07)
 * y se envía cuando la app vuelva a tener conexión.
 */
export async function writeNotificationRecord(
  routineId: string,
  ownerId: string,
  result: NotificationOutcome,
  at: number,
  repository: Pick<VerificationRecordRepository, 'create'> = appRepositories.records,
): Promise<void> {
  const record: PendingRecord = {
    id: Crypto.randomUUID(),
    routineId,
    result,
    date: new Date(at).toISOString(),
    itemsChecked: null,
    durationSeconds: null,
  };
  try {
    await repository.create(record);
  } catch (cause) {
    if (!isNetworkError(cause)) throw cause;
    await enqueue(ownerId, record);
  }
}
