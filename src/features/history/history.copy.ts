// Microcopy del Historial (P09). EV-02 viene del Documento de Contenido; el resto no tiene código:
// propuesto, pendiente de validar.

import { formatClock } from '@/shared/utils/formatClock';

import { formatDayHeading, toLocalDayKey } from './history.dates';

/** EV-02 */
export const EMPTY_MESSAGE = 'Aquí verás cada verificación que hagas.';

// 09-3
export const FILTER_ROUTINE_LABEL = 'Rutina';
export const FILTER_RESULT_LABEL = 'Resultado';
export const ALL_ROUTINES_LABEL = 'Todas';
export const ALL_RESULTS_LABEL = 'Todos';
export const FILTER_EMPTY_MESSAGE = 'Nada con este filtro. Prueba con otro.';

// 09-4
export const MOST_SKIPPED_TITLE = 'Más omitidos';
export const timesLabel = (count: number) => (count === 1 ? '1 vez' : `${count} veces`);

// Hoja de detalle de un registro.
export const DETAIL_CLOSE_LABEL = 'Cerrar';
export const DETAIL_CHECKED_TITLE = 'Marcados';
export const DETAIL_SKIPPED_TITLE = 'Omitidos';
export const DETAIL_DURATION_TITLE = 'Duración';
export const DETAIL_NO_ITEMS = 'Esta vez no se marcó ningún ítem.';
export const CRITICAL_LABEL = 'crítico';
export const openDetailHint = 'Abre el detalle';

/** "Hoy, 6:00 p. m." · "Lunes, 29 de septiembre, 6:00 p. m." (hora local). null si la fecha no es válida. */
export function recordDateTime(iso: string, now: Date = new Date()): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const clock = formatClock({ hour: date.getHours(), minute: date.getMinutes() });
  return `${formatDayHeading(toLocalDayKey(date), now)}, ${clock}`;
}

/** Marca de un ítem temporal añadido por el clima (solo esa verificación). */
export const WEATHER_ORIGIN_LABEL = 'Clima';
