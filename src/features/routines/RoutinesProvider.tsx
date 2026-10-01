import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { appRepositories } from '@/db/app.repositories';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Routine } from '@/shared/types/routine.types';

import { createRoutineWithItems, type RoutineServiceDeps } from './routine.service';
import { hasValidationErrors, validateRoutineDraft } from './routine.validation';
import { RoutinesContext } from './routines.context';
import type { CreateRoutineResult, RoutineDraft, RoutinesContextValue } from './routines.types';

const LOAD_ERROR = 'No pudimos cargar tus rutinas. Revisa tu conexión e inténtalo de nuevo.';
const SAVE_ERROR = 'No se pudo guardar la rutina. Revisa tu conexión e inténtalo de nuevo.';

const defaultRepositories: RoutineServiceDeps = {
  routines: appRepositories.routines,
  items: appRepositories.items,
};

interface RoutinesProviderProps {
  children: ReactNode;
  /** Inyectable para tests; por defecto los repositorios de Supabase. */
  repositories?: RoutineServiceDeps;
}

export function RoutinesProvider({ children, repositories = defaultRepositories }: RoutinesProviderProps) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(userId !== null);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de peticiones viejas (ej. tras cerrar sesión o un refresh más nuevo).
  const latestRequest = useRef(0);

  // Al cambiar de usuario (login/logout) se reinicia el estado durante el render,
  // para no mostrar nunca rutinas de otra sesión.
  const [stateOwner, setStateOwner] = useState(userId);
  if (stateOwner !== userId) {
    setStateOwner(userId);
    setRoutines([]);
    setError(null);
    setLoading(userId !== null);
  }

  // Pide las rutinas; el estado solo se toca en los callbacks de la promesa (nunca de forma síncrona).
  const fetchRoutines = useCallback((): Promise<void> => {
    const request = ++latestRequest.current;
    const isLatest = () => request === latestRequest.current;

    return repositories.routines.getAll().then(
      (data) => {
        if (!isLatest()) return;
        setRoutines(data);
        setError(null);
        setLoading(false);
      },
      (cause: unknown) => {
        if (!isLatest()) return;
        if (__DEV__) console.warn('[routines.getAll]', cause);
        setError(LOAD_ERROR);
        setLoading(false);
      },
    );
  }, [repositories]);

  useEffect(() => {
    if (userId) void fetchRoutines();
    else latestRequest.current += 1;
  }, [userId, fetchRoutines]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    await fetchRoutines();
  }, [userId, fetchRoutines]);

  const createRoutine = useCallback(
    async (draft: RoutineDraft): Promise<CreateRoutineResult> => {
      const errors = validateRoutineDraft(draft);
      if (hasValidationErrors(errors)) return { status: 'invalid', errors };

      try {
        const routine = await createRoutineWithItems(repositories, draft);
        setRoutines((current) => [...current, routine]);
        return { status: 'created', routine };
      } catch (cause) {
        if (__DEV__) console.warn('[routines.create]', cause);
        return { status: 'failed', error: SAVE_ERROR };
      }
    },
    [repositories],
  );

  const value = useMemo<RoutinesContextValue>(
    () => ({ routines, loading, error, refresh, createRoutine }),
    [routines, loading, error, refresh, createRoutine],
  );

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}
