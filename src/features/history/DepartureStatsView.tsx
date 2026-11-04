import { DepartureStatsSection } from './DepartureStatsSection';
import { useDepartureStats } from './useDepartureStats';
import type { HistoryData } from './useHistory';

/**
 * Vista «Estadísticas» del Historial. El hook vive aquí, no en la pantalla: así el cálculo y su reloj por
 * minuto solo corren mientras esta vista está visible, no con el listado.
 */
export function DepartureStatsView({ history }: { history: HistoryData }) {
  const stats = useDepartureStats(history);
  return <DepartureStatsSection status={stats.status} summary={stats.summary} />;
}
