import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';

import { appRepositories } from '@/db/app.repositories';
import { isNetworkError } from '@/db/repositories/repository.types';
import type { VerificationRecordRepository } from '@/db/repositories/verification-record.repository';
import { useAuth } from '@/features/auth/AuthProvider';
import { useNetworkStatus } from '@/shared/network/useNetworkStatus';

import { summarize, toCheckedEntries } from './checklist.outcome';
import type { ChecklistItemState, FinishIntent, VerificationSummary } from './checklist.types';
import { enqueue, type PendingRecord } from './pendingSync';

const SAVE_ERROR = 'No se pudo guardar la verificación. Inténtalo de nuevo.';

/**
 * Termina la verificación y guarda el registro. Sin conexión (o si falla por red) el registro
 * va a la cola de pendientes y la verificación se da por terminada igual: el usuario está
 * en la puerta y no debe esperar a la red. Solo un rechazo real del servidor muestra error.
 */
export function useFinishChecklist(
  routineId: string,
  items: readonly ChecklistItemState[],
  startedAt: number | null,
  repository: Pick<VerificationRecordRepository, 'create'> = appRepositories.records,
) {
  const { user } = useAuth();
  const { isConnected } = useNetworkStatus();
  const userId = user?.id ?? null;
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = useCallback(
    async (intent: FinishIntent): Promise<VerificationSummary | null> => {
      if (!userId) return null; // RequireSession ya impide llegar aquí sin sesión.

      const now = Date.now();
      const durationSeconds = startedAt === null ? 0 : Math.round((now - startedAt) / 1000);
      const summary = summarize(items, intent, durationSeconds);
      const record: PendingRecord = {
        id: Crypto.randomUUID(),
        routineId,
        result: summary.outcome,
        itemsChecked: toCheckedEntries(items),
        durationSeconds,
        date: new Date(now).toISOString(),
      };

      setFinishing(true);
      setError(null);
      try {
        if (!isConnected) {
          await enqueue(userId, record);
        } else {
          try {
            await repository.create(record);
          } catch (cause) {
            if (!isNetworkError(cause)) throw cause;
            await enqueue(userId, record);
          }
        }
        return summary;
      } catch (cause) {
        if (__DEV__) console.warn('[checklist.finish]', cause);
        setError(SAVE_ERROR);
        return null;
      } finally {
        setFinishing(false);
      }
    },
    [userId, isConnected, startedAt, items, routineId, repository],
  );

  return { finish, finishing, error };
}
