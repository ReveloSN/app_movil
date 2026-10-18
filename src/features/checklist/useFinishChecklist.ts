import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';

import type { LocalRepositories } from '@/db/local/local.repositories';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLocalRepositories } from '@/features/local-data/LocalRepositoriesProvider';

import { summarize, toCheckedEntries } from './checklist.outcome';
import type { ChecklistItemState, FinishIntent, VerificationSummary } from './checklist.types';

const SAVE_ERROR = 'No se pudo guardar la verificación. Inténtalo de nuevo.';

/**
 * Termina la verificación y guarda el registro en la cola local (outbox): no espera a la red, el usuario
 * está en la puerta. Se sube al servidor cuando haya sincronización. Solo un fallo al guardar en el
 * teléfono muestra error.
 */
export function useFinishChecklist(
  routineId: string,
  items: readonly ChecklistItemState[],
  startedAt: number | null,
  injected?: Pick<LocalRepositories['records'], 'create'>,
) {
  const local = useLocalRepositories();
  const repository = injected ?? local.records;
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = useCallback(
    async (intent: FinishIntent): Promise<VerificationSummary | null> => {
      if (!userId) return null; // RequireSession ya impide llegar aquí sin sesión.

      const now = Date.now();
      const durationSeconds = startedAt === null ? 0 : Math.round((now - startedAt) / 1000);
      const summary = summarize(items, intent, durationSeconds);

      setFinishing(true);
      setError(null);
      const recordId = Crypto.randomUUID();
      try {
        await repository.create({
          id: recordId,
          routineId,
          result: summary.outcome,
          itemsChecked: toCheckedEntries(items),
          durationSeconds,
          date: new Date(now).toISOString(),
        });
        return { ...summary, recordId };
      } catch (cause) {
        if (__DEV__) console.warn('[checklist.finish]', cause);
        setError(SAVE_ERROR);
        return null;
      } finally {
        setFinishing(false);
      }
    },
    [userId, startedAt, items, routineId, repository],
  );

  return { finish, finishing, error };
}
