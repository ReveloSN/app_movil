import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useLocalRepositories, useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';
import type { Routine } from '@/shared/types/routine.types';

import { deleteRoutineCascade, type RoutineDeleteDeps } from './routine-delete.service';
import { updateRoutineWithItems, type RoutineOriginal } from './routine-edit.service';
import { createRoutineWithItems, type RoutineServiceDeps } from './routine.service';
import { hasValidationErrors, validateRoutineDraft } from './routine.validation';
import { RoutinesContext } from './routines.context';
import type { DeleteRoutineResult, RoutineDraft, RoutinesContextValue, SaveRoutineResult } from './routines.types';

const LOAD_ERROR = 'No pudimos cargar tus rutinas. Revisa tu conexión e inténtalo de nuevo.';
const SAVE_ERROR = 'No se pudo guardar la rutina. Revisa tu conexión e inténtalo de nuevo.';
const DELETE_ERROR = 'No se pudo eliminar la rutina. Revisa tu conexión e inténtalo de nuevo.';

type RoutinesRepositories = RoutineServiceDeps & RoutineDeleteDeps;

interface RoutinesProviderProps {
  children: ReactNode;
  /** Inyectable para tests; por defecto los repositorios locales del usuario. */
  repositories?: RoutinesRepositories;
}

export function RoutinesProvider({ children, repositories: injected }: RoutinesProviderProps) {
  const local = useLocalRepositories();
  const store = useLocalStore();
  const repositories = injected ?? local;
  const { user } = useAuth();
  const userId = user?.id ?? null;

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

  // Lo que cambia en la copia local fuera de esta pantalla (lo que trae la sincronización, o "Última vez"
  // al terminar una verificación) se ve sin recargar.
  useEffect(
    () =>
      store.subscribe((change) => {
        if (userId && change.tablesChanged) void fetchRoutines();
      }),
    [store, userId, fetchRoutines],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    await fetchRoutines();
  }, [userId, fetchRoutines]);

  const createRoutine = useCallback(
    async (draft: RoutineDraft): Promise<SaveRoutineResult> => {
      const errors = validateRoutineDraft(draft);
      if (hasValidationErrors(errors)) return { status: 'invalid', errors };

      try {
        const routine = await createRoutineWithItems(repositories, draft);
        setRoutines((current) => [...current, routine]);
        return { status: 'saved', routine };
      } catch (cause) {
        if (__DEV__) console.warn('[routines.create]', cause);
        return { status: 'failed', error: SAVE_ERROR };
      }
    },
    [repositories],
  );

  const updateRoutine = useCallback(
    async (routineId: string, draft: RoutineDraft, original: RoutineOriginal): Promise<SaveRoutineResult> => {
      const errors = validateRoutineDraft(draft);
      if (hasValidationErrors(errors)) return { status: 'invalid', errors };

      try {
        const routine = await updateRoutineWithItems(repositories, routineId, draft, original);
        setRoutines((current) => current.map((item) => (item.id === routine.id ? routine : item)));
        return { status: 'saved', routine };
      } catch (cause) {
        if (__DEV__) console.warn('[routines.update]', cause);
        return { status: 'failed', error: SAVE_ERROR };
      }
    },
    [repositories],
  );

  const deleteRoutine = useCallback(
    async (routineId: string): Promise<DeleteRoutineResult> => {
      try {
        const how = await deleteRoutineCascade(repositories, routineId);
        // Deja ver en desarrollo si la base borró en cascada o hubo que borrar a mano.
        if (__DEV__) console.info('[routines.delete] dependencias:', how);
        setRoutines((current) => current.filter((item) => item.id !== routineId));
        return { status: 'deleted' };
      } catch (cause) {
        if (__DEV__) console.warn('[routines.delete]', cause);
        return { status: 'failed', error: DELETE_ERROR };
      }
    },
    [repositories],
  );

  const value = useMemo<RoutinesContextValue>(
    () => ({ routines, loading, error, refresh, createRoutine, updateRoutine, deleteRoutine }),
    [routines, loading, error, refresh, createRoutine, updateRoutine, deleteRoutine],
  );

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}
