import { useEffect, useState } from 'react';

import { useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';

import { withPendingRecords } from './history.pending';
import { MIN_STREAK_SHOWN, routineStreak } from './history.streak';

/**
 * Racha de la rutina desde el historial local (incluye la verificación recién terminada, aún sin subir).
 * Devuelve null si no hay racha que mostrar (menos de 2 días): nunca se avisa que se perdió.
 */
export function useRoutineStreak(routineId: string): number | null {
  const store = useLocalStore();
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    store.read().then(
      (doc) => {
        if (!active) return;
        const days = routineStreak(withPendingRecords(doc.records ?? [], doc.outbox), routineId, new Date());
        setStreak(days >= MIN_STREAK_SHOWN ? days : null);
      },
      (cause: unknown) => {
        if (__DEV__) console.warn('[history.streak]', cause);
      },
    );
    return () => {
      active = false;
    };
  }, [store, routineId]);

  return streak;
}
