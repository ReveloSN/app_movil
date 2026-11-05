import { useMemo } from 'react';

import { useRoutines } from '@/features/routines/useRoutines';
import { useMinuteClock } from '@/shared/hooks/useMinuteClock';

import { departureRoutineIdsOf, departureSummary, type DepartureSummary } from './stats';
import type { HistoryData } from './useHistory';

export type DepartureStatsStatus = 'loading' | 'empty' | 'ready';

export interface DepartureStats {
  /** loading: aún no hay nada que mostrar; empty: sin salidas registradas; ready: hay datos. */
  status: DepartureStatsStatus;
  /** Siempre presente (en ceros mientras carga o sin salidas) para no ramificar en la pantalla. */
  summary: DepartureSummary;
  error: string | null;
  refresh(): Promise<void>;
}

/**
 * Estadísticas de salidas para el Historial: los registros (con los pendientes de subir, de `useHistory`;
 * la pantalla pasa los suyos para no leer la copia local dos veces) y las rutinas se combinan en
 * `departureSummary`. El set de ids y el resumen se memoizan: solo se recalculan al
 * cambiar los datos o el minuto.
 */
export function useDepartureStats(history: HistoryData): DepartureStats {
  const { records, loading: historyLoading, error, refresh } = history;
  const { routines, loading: routinesLoading } = useRoutines();
  const now = useMinuteClock();

  const departureIds = useMemo(() => departureRoutineIdsOf(routines), [routines]);
  const summary = useMemo(() => departureSummary(records, departureIds, now), [records, departureIds, now]);

  const loading = (historyLoading && records.length === 0) || (routinesLoading && routines.length === 0);
  const status: DepartureStatsStatus = loading ? 'loading' : summary.totalRecords === 0 ? 'empty' : 'ready';

  return { status, summary, error, refresh };
}
