import { useCallback, useEffect, useRef, useState } from 'react';

import { appRepositories } from '@/db/app.repositories';
import type { Routine } from '@/shared/types/routine.types';

import { loadRoutineForEdit, type LoadedRoutine, type RoutineLoadDeps } from './routine-load.service';

export type LoadedRoutineState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; loaded: LoadedRoutine };

const defaultDeps: RoutineLoadDeps = appRepositories;

/**
 * Carga ítems y avisos de una rutina para editarla (una vez por rutina; `retry` reintenta).
 * `onLoaded` corre antes de marcarla lista: sirve para sembrar los avisos en P04/P06.
 */
export function useLoadedRoutine(
  routine: Routine | undefined,
  onLoaded: (loaded: LoadedRoutine) => void,
  deps: RoutineLoadDeps = defaultDeps,
) {
  const [state, setState] = useState<LoadedRoutineState>({ status: 'loading' });
  const latestRequest = useRef(0);
  // Lo último de cada render: la carga depende solo del id, no de cada cambio del objeto.
  const latest = useRef({ routine, onLoaded });
  useEffect(() => {
    latest.current = { routine, onLoaded };
  });

  const load = useCallback(() => {
    const current = latest.current.routine;
    if (!current) return;
    const request = ++latestRequest.current;
    loadRoutineForEdit(deps, current).then(
      (loaded) => {
        if (request !== latestRequest.current) return;
        latest.current.onLoaded(loaded);
        setState({ status: 'ready', loaded });
      },
      (cause: unknown) => {
        if (request !== latestRequest.current) return;
        if (__DEV__) console.warn('[routines.loadForEdit]', cause);
        setState({ status: 'error' });
      },
    );
  }, [deps]);

  const routineId = routine?.id;
  useEffect(() => {
    if (routineId) load();
  }, [routineId, load]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    load();
  }, [load]);

  return { state, retry };
}
