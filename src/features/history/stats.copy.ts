// Microcopy de las estadísticas de salidas (Historial). Propuesto, pendiente de validar.
// Tuteo, sin emojis; singular y plural correctos.

import type { CompletionRate, WeeklyDay } from './stats';

// Selector Historial | Estadísticas
export const VIEW_GROUP_LABEL = 'Vista del historial';
export const VIEW_HISTORY_LABEL = 'Historial';
export const VIEW_STATS_LABEL = 'Estadísticas';

export const STATS_LOADING_LABEL = 'Cargando estadísticas';

// Estado vacío
export const STATS_EMPTY_TITLE = 'Aún no hay salidas';
export const STATS_EMPTY_MESSAGE =
  'Haz tu primera verificación antes de salir de casa y aquí verás tu racha, tu cumplimiento y tu semana.';

// Rachas
export const CURRENT_STREAK_TITLE = 'Racha actual';
export const BEST_STREAK_TITLE = 'Mejor racha';
export const daysUnit = (days: number) => (days === 1 ? 'día' : 'días');
export const streakA11y = (title: string, days: number) => `${title}: ${days} ${daysUnit(days)}`;

// Cumplimiento
export const COMPLETION_TITLE = 'Cumplimiento';
export const RATE_7_TITLE = 'Últimos 7 días';
export const RATE_30_TITLE = 'Últimos 30 días';
export const NO_DEPARTURES_YET = 'Sin salidas aún';
export const percentLabel = (percent: number) => `${percent} %`;
export const ratePercent = (rate: number) => Math.round(rate * 100);
/** Las parciales no suman al porcentaje; se muestran aparte. null si no hay ninguna. */
export const partialsNote = (partial: number): string | null => {
  if (partial <= 0) return null;
  return partial === 1 ? '1 parcial no cuenta' : `${partial} parciales no cuentan`;
};
export function rateA11y(title: string, rate: CompletionRate): string {
  if (rate.rate === null) return `${title}: ${NO_DEPARTURES_YET.toLowerCase()}`;
  const note = partialsNote(rate.partial);
  return `${title}: ${ratePercent(rate.rate)} %${note ? `, ${note}` : ''}`;
}

// Total
export const TOTAL_TITLE = 'Salidas completadas';
export const totalA11y = (total: number) => `${TOTAL_TITLE}: ${total}`;

// Gráfico semanal
export const WEEK_TITLE = 'Esta semana';
const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
/** Una letra por día; la X de miércoles evita repetir la M de martes. */
const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const weekdayInitial = (weekday: number) => WEEKDAY_INITIALS[weekday];
export const completedCount = (count: number) =>
  count === 0 ? 'sin salidas completadas' : count === 1 ? '1 salida completada' : `${count} salidas completadas`;
export function dayA11y(day: WeeklyDay): string {
  const name = WEEKDAYS[day.weekday];
  if (day.isFuture) return `${name}, todavía no llega`;
  return `${name}${day.isToday ? ' (hoy)' : ''}, ${completedCount(day.completed)}`;
}
export const weekSummaryLabel = (completed: number) => `Salidas completadas esta semana: ${completed}`;
