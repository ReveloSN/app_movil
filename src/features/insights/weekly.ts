// "Tu semana" (Historial): estadísticas AGREGADAS de la semana y su resumen determinista (sin IA).
// Lo mismo que se envía a la IA cuando la persona pide el resumen: nunca el historial completo.

import type { WeeklyStatsInput } from '@/features/ai/ai.stats';
import { mostSkippedItems } from '@/features/history/history.filter';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const pad = (value: number) => String(value).padStart(2, '0');
const isoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Lunes (00:00 local) de la semana de `date`. */
export function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

/** Clave de la semana: el lunes en "AAAA-MM-DD" (hora local). */
export const weekKey = (date: Date) => isoDay(mondayOf(date));

const localDay = (epochMs: number) => {
  const date = new Date(epochMs);
  return Math.round(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / DAY_MS);
};

/** Días seguidos (hasta hoy o ayer) con al menos una verificación completa, de cualquier rutina. */
function overallStreak(records: readonly VerificationRecord[], now: Date): number {
  const days = new Set(
    records.filter((record) => record.result === 'completed').map((record) => Date.parse(record.date)).filter(Number.isFinite).map(localDay),
  );
  const today = localDay(now.getTime());
  let day = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}

const inRange = (record: VerificationRecord, from: number, to: number) => {
  const at = Date.parse(record.date);
  return Number.isFinite(at) && at >= from && at < to;
};

/** Estadísticas de la semana de `now` (de lunes a domingo) comparadas con la anterior. */
export function buildWeeklyStats(records: readonly VerificationRecord[], now: Date): WeeklyStatsInput {
  const start = mondayOf(now).getTime();
  const end = start + 7 * DAY_MS;
  const week = records.filter((record) => inRange(record, start, end));
  const previous = records.filter((record) => inRange(record, start - 7 * DAY_MS, start));

  const byDay = Array.from({ length: 7 }, () => ({ good: 0, bad: 0 }));
  for (const record of week) {
    const day = new Date(Date.parse(record.date)).getDay();
    if (record.result === 'completed') byDay[day].good += 1;
    else if (record.result === 'partial' || record.result === 'no_response') byDay[day].bad += 1;
  }
  const pick = (score: (day: { good: number; bad: number }) => number) => {
    let best: number | null = null;
    byDay.forEach((day, index) => {
      if (score(day) > 0 && (best === null || score(day) > score(byDay[best]))) best = index;
    });
    return best;
  };

  return {
    weekStart: isoDay(new Date(start)),
    completed: week.filter((record) => record.result === 'completed').length,
    partial: week.filter((record) => record.result === 'partial').length,
    // "Hoy no salgo": la verificación omitida a propósito (Omitir por hoy).
    skipped: week.filter((record) => record.result === 'skipped').length,
    streak: overallStreak(records, now),
    previousCompleted: previous.filter((record) => record.result === 'completed').length,
    topSkipped: mostSkippedItems(week, 3),
    bestDay: pick((day) => day.good),
    worstDay: pick((day) => day.bad),
  };
}

/** true si la semana aún no tiene ninguna verificación (no hay nada que resumir). */
export const isEmptyWeek = (stats: WeeklyStatsInput) => stats.completed + stats.partial + stats.skipped === 0;

export interface WeekSummaryText {
  resumen: string;
  recomendacion: string;
}

const times = (count: number) => (count === 1 ? '1 vez' : `${count} veces`);

/** Resumen sin IA (sin conexión, con la IA apagada o sin cuota): breve, sin culpa y con UNA recomendación. */
export function deterministicSummary(stats: WeeklyStatsInput): WeekSummaryText {
  const total = stats.completed + stats.partial;
  const complete = stats.completed === 1 ? '1 completa' : `${stats.completed} completas`;
  const parts = [`Esta semana verificaste ${times(total)}: ${complete}.`];
  const diff = stats.completed - stats.previousCompleted;
  if (diff > 0) parts.push(diff === 1 ? 'Es 1 más que la semana pasada.' : `Son ${diff} más que la semana pasada.`);
  else if (diff < 0 && stats.previousCompleted > 0) parts.push(`La semana pasada fueron ${stats.previousCompleted}.`);
  if (stats.streak >= 2) parts.push(`Llevas ${stats.streak} días seguidos.`);
  if (stats.bestDay !== null) parts.push(`Tu mejor día fue el ${DAY_NAMES[stats.bestDay]}.`);

  const top = stats.topSkipped[0];
  const recomendacion = top
    ? `«${top.label}» se quedó ${times(top.count)}: déjalo junto a la puerta la noche antes.`
    : stats.partial > 0
      ? 'Revisa tu rutina y deja solo lo que de verdad no puede faltar.'
      : 'Sigue así: tu rutina ya te funciona.';
  return { resumen: parts.join(' ').slice(0, 280), recomendacion: recomendacion.slice(0, 140) };
}
