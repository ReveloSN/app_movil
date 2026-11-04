import { useEffect, useState } from 'react';

import { useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';
import { useRoutines } from '@/features/routines/useRoutines';

import { withPendingRecords } from './history.pending';
import { MIN_STREAK_SHOWN, routineStreak } from './history.streak';

/**
 * Racha de la rutina desde el historial local (incluye la verificación recién terminada, aún sin subir).
 * Devuelve null si no hay racha que mostrar (menos de 2 días): nunca se avisa que se perdió.
 * Las rutinas de llegada no tienen racha: quedan fuera de las estadísticas de salida.
 */
export function useRoutineStreak(routineId: string): number | null {
  const store = useLocalStore();
  const { routines } = useRoutines();
  const arrival = routines.find((routine) => routine.id === routineId)?.kind === 'arrival';
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    if (arrival) return;
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
  }, [store, routineId, arrival]);

  return arrival ? null : streak;
}
