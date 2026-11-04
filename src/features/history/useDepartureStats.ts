import { useEffect, useMemo, useState } from 'react';

import { useRoutines } from '@/features/routines/useRoutines';

import { departureRoutineIdsOf, departureSummary, type DepartureSummary } from './stats';
import { useHistory } from './useHistory';

export type DepartureStatsStatus = 'loading' | 'empty' | 'ready';

export interface DepartureStats {
  /** loading: aún no hay nada que mostrar; empty: sin salidas registradas; ready: hay datos. */
  status: DepartureStatsStatus;
  /** Siempre presente (en ceros mientras carga o sin salidas) para no ramificar en la pantalla. */
  summary: DepartureSummary;
  error: string | null;
  refresh(): Promise<void>;
}

const MINUTE_MS = 60_000;
const minuteOf = () => Math.floor(Date.now() / MINUTE_MS);

/**
 * "Ahora" estable: cambia una vez por minuto, no en cada render. Así el resumen no se recalcula
 * mientras se escribe, se desplaza o se anima, pero el día siguiente se detecta en menos de un minuto.
 */
function useMinuteClock(): Date {
  const [minute, setMinute] = useState(minuteOf);
  useEffect(() => {
    const timer = setInterval(() => setMinute(minuteOf()), MINUTE_MS);
    return () => clearInterval(timer);
  }, []);
  return useMemo(() => new Date(minute * MINUTE_MS), [minute]);
}

/**
 * Estadísticas de salidas para el Historial: los registros (con los pendientes de subir) y las rutinas
 * se combinan en `departureSummary`. El set de ids y el resumen se memoizan: solo se recalculan al
 * cambiar los datos o el minuto.
 */
export function useDepartureStats(): DepartureStats {
  const { records, loading: historyLoading, error, refresh } = useHistory();
  const { routines, loading: routinesLoading } = useRoutines();
  const now = useMinuteClock();

  const departureIds = useMemo(() => departureRoutineIdsOf(routines), [routines]);
  const summary = useMemo(() => departureSummary(records, departureIds, now), [records, departureIds, now]);

  const loading = (historyLoading && records.length === 0) || (routinesLoading && routines.length === 0);
  const status: DepartureStatsStatus = loading ? 'loading' : summary.totalRecords === 0 ? 'empty' : 'ready';

  return { status, summary, error, refresh };
}
