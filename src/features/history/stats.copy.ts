// Microcopy de las estadísticas de salidas (Historial). Propuesto, pendiente de validar.
// Tuteo, sin emojis; singular y plural correctos.

import { localized } from '@/shared/i18n/localized';

import type { CompletionRate, WeeklyDay } from './stats';

/** Porcentaje entero de una tasa (0–1). Neutro al idioma. */
export const ratePercent = (rate: number) => Math.round(rate * 100);

const WEEKDAYS_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
const WEEKDAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
/** Una letra por día; la X de miércoles evita repetir la M de martes. */
const WEEKDAY_INITIALS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const WEEKDAY_INITIALS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const daysUnitEs = (days: number) => (days === 1 ? 'día' : 'días');
const daysUnitEn = (days: number) => (days === 1 ? 'day' : 'days');

const NO_DEPARTURES_YET_ES = 'Sin salidas aún';
const NO_DEPARTURES_YET_EN = 'No departures yet';
const TOTAL_TITLE_ES = 'Salidas completadas';
const TOTAL_TITLE_EN = 'Completed departures';

const partialsNoteEs = (partial: number): string | null => {
  if (partial <= 0) return null;
  return partial === 1 ? '1 parcial no cuenta' : `${partial} parciales no cuentan`;
};
const partialsNoteEn = (partial: number): string | null => {
  if (partial <= 0) return null;
  return partial === 1 ? '1 partial does not count' : `${partial} partials do not count`;
};

const completedCountEs = (count: number) =>
  count === 0 ? 'sin salidas completadas' : count === 1 ? '1 salida completada' : `${count} salidas completadas`;
const completedCountEn = (count: number) =>
  count === 0 ? 'no completed departures' : count === 1 ? '1 completed departure' : `${count} completed departures`;

export default localized(
  {
    // Selector Historial | Estadísticas
    VIEW_GROUP_LABEL: 'Vista del historial',
    VIEW_HISTORY_LABEL: 'Historial',
    VIEW_STATS_LABEL: 'Estadísticas',

    STATS_LOADING_LABEL: 'Cargando estadísticas',

    // Estado vacío
    STATS_EMPTY_TITLE: 'Aún no hay salidas',
    STATS_EMPTY_MESSAGE: 'Haz tu primera verificación antes de salir de casa y aquí verás tu racha, tu cumplimiento y tu semana.',

    // Rachas
    CURRENT_STREAK_TITLE: 'Racha actual',
    BEST_STREAK_TITLE: 'Mejor racha',
    daysUnit: daysUnitEs,
    streakA11y: (title: string, days: number) => `${title}: ${days} ${daysUnitEs(days)}`,

    // Cumplimiento
    COMPLETION_TITLE: 'Cumplimiento',
    RATE_7_TITLE: 'Últimos 7 días',
    RATE_30_TITLE: 'Últimos 30 días',
    NO_DEPARTURES_YET: NO_DEPARTURES_YET_ES,
    percentLabel: (percent: number) => `${percent} %`,
    /** Las parciales no suman al porcentaje; se muestran aparte. null si no hay ninguna. */
    partialsNote: partialsNoteEs,
    rateA11y: (title: string, rate: CompletionRate): string => {
      if (rate.rate === null) return `${title}: ${NO_DEPARTURES_YET_ES.toLowerCase()}`;
      const note = partialsNoteEs(rate.partial);
      return `${title}: ${ratePercent(rate.rate)} %${note ? `, ${note}` : ''}`;
    },

    // Total
    TOTAL_TITLE: TOTAL_TITLE_ES,
    totalA11y: (total: number) => `${TOTAL_TITLE_ES}: ${total}`,

    // Gráfico semanal
    WEEK_TITLE: 'Esta semana',
    weekdayInitial: (weekday: number) => WEEKDAY_INITIALS_ES[weekday],
    completedCount: completedCountEs,
    dayA11y: (day: WeeklyDay): string => {
      const name = WEEKDAYS_ES[day.weekday];
      if (day.isFuture) return `${name}, todavía no llega`;
      return `${name}${day.isToday ? ' (hoy)' : ''}, ${completedCountEs(day.completed)}`;
    },
    weekSummaryLabel: (completed: number) => `Salidas completadas esta semana: ${completed}`,
  },
  {
    VIEW_GROUP_LABEL: 'History view',
    VIEW_HISTORY_LABEL: 'History',
    VIEW_STATS_LABEL: 'Stats',

    STATS_LOADING_LABEL: 'Loading stats',

    STATS_EMPTY_TITLE: 'No departures yet',
    STATS_EMPTY_MESSAGE: "Do your first check before leaving home and you'll see your streak, your completion and your week here.",

    CURRENT_STREAK_TITLE: 'Current streak',
    BEST_STREAK_TITLE: 'Best streak',
    daysUnit: daysUnitEn,
    streakA11y: (title: string, days: number) => `${title}: ${days} ${daysUnitEn(days)}`,

    COMPLETION_TITLE: 'Completion',
    RATE_7_TITLE: 'Last 7 days',
    RATE_30_TITLE: 'Last 30 days',
    NO_DEPARTURES_YET: NO_DEPARTURES_YET_EN,
    percentLabel: (percent: number) => `${percent}%`,
    partialsNote: partialsNoteEn,
    rateA11y: (title: string, rate: CompletionRate): string => {
      if (rate.rate === null) return `${title}: ${NO_DEPARTURES_YET_EN.toLowerCase()}`;
      const note = partialsNoteEn(rate.partial);
      return `${title}: ${ratePercent(rate.rate)}%${note ? `, ${note}` : ''}`;
    },

    TOTAL_TITLE: TOTAL_TITLE_EN,
    totalA11y: (total: number) => `${TOTAL_TITLE_EN}: ${total}`,

    WEEK_TITLE: 'This week',
    weekdayInitial: (weekday: number) => WEEKDAY_INITIALS_EN[weekday],
    completedCount: completedCountEn,
    dayA11y: (day: WeeklyDay): string => {
      const name = WEEKDAYS_EN[day.weekday];
      if (day.isFuture) return `${name}, not here yet`;
      return `${name}${day.isToday ? ' (today)' : ''}, ${completedCountEn(day.completed)}`;
    },
    weekSummaryLabel: (completed: number) => `Completed departures this week: ${completed}`,
  },
);
