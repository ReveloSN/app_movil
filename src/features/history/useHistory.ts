import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { appRepositories } from '@/db/app.repositories';
import type { VerificationRecordRepository } from '@/db/repositories/verification-record.repository';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRoutines } from '@/features/routines/useRoutines';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { groupRecordsByDay } from './history.grouping';
import type { HistoryState } from './history.types';

const LOAD_ERROR = 'No pudimos cargar tu historial. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Historial del usuario agrupado por día local. Carga todos los registros en una sola consulta
 * (RLS limita a los del usuario) y resuelve la rutina de cada uno con las rutinas ya cargadas.
 */
export function useHistory(
  repository: Pick<VerificationRecordRepository, 'getAll'> = appRepositories.records,
): HistoryState {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { routines, loading: routinesLoading, error: routinesError, refresh: refreshRoutines } = useRoutines();

  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(userId !== null);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de peticiones viejas (ej. tras cerrar sesión o un refresh más nuevo).
  const latestRequest = useRef(0);

  // Al cambiar de usuario se reinicia el estado durante el render: nunca se ve el historial de otra sesión.
  const [stateOwner, setStateOwner] = useState(userId);
  if (stateOwner !== userId) {
    setStateOwner(userId);
    setRecords([]);
    setError(null);
    setLoading(userId !== null);
  }

  // Pide los registros; el estado solo se toca en los callbacks de la promesa (nunca de forma síncrona).
  const fetchRecords = useCallback((): Promise<void> => {
    const request = ++latestRequest.current;
    const isLatest = () => request === latestRequest.current;

    return repository.getAll().then(
      (data) => {
        if (!isLatest()) return;
        setRecords(data);
        setError(null);
        setLoading(false);
      },
      (cause: unknown) => {
        if (!isLatest()) return;
        if (__DEV__) console.warn('[records.getAll]', cause);
        setError(LOAD_ERROR);
        setLoading(false);
      },
    );
  }, [repository]);

  useEffect(() => {
    if (userId) void fetchRecords();
    else latestRequest.current += 1;
  }, [userId, fetchRecords]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    await Promise.all([fetchRecords(), refreshRoutines()]);
  }, [userId, fetchRecords, refreshRoutines]);

  const groups = useMemo(() => groupRecordsByDay(records, routines), [records, routines]);

  // Sin rutinas cargadas, todo saldría como "Rutina eliminada": se espera a tenerlas o se muestra el error.
  const routinesMissing = routines.length === 0;

  return {
    groups,
    loading: loading || (routinesMissing && routinesLoading),
    error: error ?? (routinesMissing && routinesError ? LOAD_ERROR : null),
    refresh,
  };
}
