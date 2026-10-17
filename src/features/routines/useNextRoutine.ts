import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { TriggerRepository } from '@/db/repositories/trigger.repository';
import { useLocalRepositories, useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';
import type { Trigger } from '@/shared/types/trigger.types';

import { findNextRoutine, type NextRoutine } from './next-routine';
import { useRoutines } from './useRoutines';

const MINUTE_MS = 60_000;

/**
 * Próxima rutina programada (P03-2), desde la copia local. Se recalcula al volver a enfocar Inicio,
 * cuando cambian los datos (también los que trae la sincronización) y cada minuto mientras se ve.
 */
export function useNextRoutine(injected?: Pick<TriggerRepository, 'getAll'>): { next: NextRoutine | null; now: Date } {
  const local = useLocalRepositories();
  const store = useLocalStore();
  const triggerRepository = injected ?? local.triggers;
  const { routines } = useRoutines();
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [now, setNow] = useState(() => new Date());

  const loadTriggers = useCallback(() => {
    triggerRepository.getAll().then(setTriggers, (cause: unknown) => {
      // Sin avisos legibles el bloque simplemente no aparece; Inicio ya muestra su propio error.
      if (__DEV__) console.warn('[home.nextRoutine]', cause);
    });
  }, [triggerRepository]);

  useEffect(() => store.subscribe((change) => change.tablesChanged && loadTriggers()), [store, loadTriggers]);

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      loadTriggers();
      const timer = setInterval(() => setNow(new Date()), MINUTE_MS);
      return () => clearInterval(timer);
    }, [loadTriggers]),
  );

  const next = useMemo(() => findNextRoutine(routines, triggers, now), [routines, triggers, now]);
  return { next, now };
}
