// Estadísticas de salidas (F8): racha global, mejor racha, % de cumplimiento y serie semanal.
// Todo se DERIVA de `records` (inmutables, ya sincronizados): no hay tablas propias. Funciones puras;
// `now` y `offsetOf` se inyectan para que los tests no dependan del reloj ni de la zona de la máquina.
//
// Filtro por tipo de rutina: las funciones de cálculo reciben los registros YA filtrados (solo salidas);
// `departureRecords` hace ese filtro y `departureSummary` lo aplica por sí mismo. Así cada cálculo sirve
// igual para otro subconjunto (p. ej. una sola rutina) sin parámetros extra.

import type { Routine } from '@/shared/types/routine.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import {
  completedDays,
  deviceUtcOffset,
  localDayNumber,
  streakEndingNear,
  type UtcOffsetMinutes,
} from './history.streak';

/**
 * Ids de las rutinas de salida ('departure'). Los registros de rutinas que no estén en la lista (p. ej.
 * borradas) quedan fuera: no se puede saber si eran de salida o de llegada.
 */
export function departureRoutineIdsOf(routines: readonly Pick<Routine, 'id' | 'kind'>[]): Set<string> {
  return new Set(routines.filter((routine) => routine.kind === 'departure').map((routine) => routine.id));
}

/** Solo los registros de rutinas de salida. */
export function departureRecords<T extends VerificationRecord>(
  records: readonly T[],
  departureRoutineIds: ReadonlySet<string>,
): T[] {
  return records.filter((record) => departureRoutineIds.has(record.routineId));
}

/**
 * Racha global: días locales seguidos con al menos una verificación completa (de cualquiera de los
 * registros recibidos), hasta hoy o, si hoy aún no hay, hasta ayer. Varias el mismo día cuentan una vez.
 * Misma semántica que `routineStreak`. Recibe los registros ya filtrados (ver `departureRecords`).
 */
export function globalStreak(
  records: readonly VerificationRecord[],
  now: Date,
  offsetOf: UtcOffsetMinutes = deviceUtcOffset,
): number {
  return streakEndingNear(completedDays(records, offsetOf), localDayNumber(now.getTime(), offsetOf));
}

/** Mejor racha histórica: el tramo más largo de días locales seguidos con al menos una completa. */
export function bestStreak(records: readonly VerificationRecord[], offsetOf: UtcOffsetMinutes = deviceUtcOffset): number {
  const days = [...completedDays(records, offsetOf)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  days.forEach((day, index) => {
    run = index > 0 && day === days[index - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

const DAY_MS = 24 * 60 * 60_000;

/** Resultados que entran en las estadísticas; cualquier otro valor de `result` se ignora. */
const OUTCOMES = ['completed', 'partial', 'skipped', 'no_response'] as const;
type Outcome = (typeof OUTCOMES)[number];
const isOutcome = (result: string): result is Outcome => (OUTCOMES as readonly string[]).includes(result);

export interface OutcomeCounts {
  completed: number;
  partial: number;
  skipped: number;
  noResponse: number;
  /** Suma de las cuatro anteriores. */
  total: number;
}

const emptyCounts = (): OutcomeCounts => ({ completed: 0, partial: 0, skipped: 0, noResponse: 0, total: 0 });

function addOutcome(counts: OutcomeCounts, outcome: Outcome): void {
  if (outcome === 'no_response') counts.noResponse += 1;
  else counts[outcome] += 1;
  counts.total += 1;
}

/** Día local de cada registro con fecha válida y resultado conocido. */
function datedOutcomes(records: readonly VerificationRecord[], offsetOf: UtcOffsetMinutes) {
  const result: { day: number; outcome: Outcome }[] = [];
  for (const record of records) {
    const time = Date.parse(record.date);
    if (Number.isNaN(time) || !isOutcome(record.result)) continue;
    result.push({ day: localDayNumber(time, offsetOf), outcome: record.result });
  }
  return result;
}

/** Últimos `days` días locales, incluido hoy (7 = hoy y los 6 anteriores). */
export interface StatsRange {
  days: number;
}

export interface CompletionRate extends OutcomeCounts {
  /**
   * completadas / total (0..1). Las parciales cuentan 0 (decisión de producto) y se informan aparte en
   * `partial`. null si no hay registros en el rango: nunca se divide por 0.
   */
  rate: number | null;
}

/** % de cumplimiento en los últimos `range.days` días locales (registros posteriores a hoy, fuera). */
export function completionRate(
  records: readonly VerificationRecord[],
  range: StatsRange,
  now: Date,
  offsetOf: UtcOffsetMinutes = deviceUtcOffset,
): CompletionRate {
  const today = localDayNumber(now.getTime(), offsetOf);
  const first = today - Math.max(0, Math.floor(range.days)) + 1;
  const counts = emptyCounts();
  for (const { day, outcome } of datedOutcomes(records, offsetOf)) {
    if (day >= first && day <= today) addOutcome(counts, outcome);
  }
  return { ...counts, rate: counts.total === 0 ? null : counts.completed / counts.total };
}

export interface WeeklyDay extends OutcomeCounts {
  /** Día local "AAAA-MM-DD". */
  date: string;
  /** 0 = lunes … 6 = domingo. */
  weekday: number;
  isToday: boolean;
  /** Aún no ha llegado (sin registros, salvo relojes desajustados). */
  isFuture: boolean;
}

/** Lunes = 0 … domingo = 6 de un día local (el día 0, 1/1/1970, fue jueves). */
const weekdayOf = (day: number) => (((day + 3) % 7) + 7) % 7;

/** "AAAA-MM-DD" de un número de día local (ya es fecha local: se formatea como UTC). */
const dayKey = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);

/**
 * Serie de la semana en curso, de lunes a domingo en hora local (como "Tu semana" en
 * insights/weekly.ts). Siempre 7 elementos; los días que no han llegado van con `isFuture` y los
 * registros fuera de la semana se ignoran.
 */
export function weeklySeries(
  records: readonly VerificationRecord[],
  now: Date,
  offsetOf: UtcOffsetMinutes = deviceUtcOffset,
): WeeklyDay[] {
  const today = localDayNumber(now.getTime(), offsetOf);
  const monday = today - weekdayOf(today);
  const series: WeeklyDay[] = Array.from({ length: 7 }, (_, weekday) => ({
    ...emptyCounts(),
    date: dayKey(monday + weekday),
    weekday,
    isToday: monday + weekday === today,
    isFuture: monday + weekday > today,
  }));
  for (const { day, outcome } of datedOutcomes(records, offsetOf)) {
    const index = day - monday;
    if (index >= 0 && index < 7) addOutcome(series[index], outcome);
  }
  return series;
}

export interface DepartureSummary {
  /** Racha global actual (ver `globalStreak`). */
  currentStreak: number;
  bestStreak: number;
  last7Days: CompletionRate;
  last30Days: CompletionRate;
  /** Salidas completadas en todo el historial. */
  totalDepartures: number;
  /** Registros de salida con resultado conocido en todo el historial (cualquier resultado). */
  totalRecords: number;
  /** Semana en curso, de lunes a domingo. */
  week: WeeklyDay[];
}

/** Todo lo que necesita la pantalla de estadísticas, solo con rutinas de salida. */
export function departureSummary(
  records: readonly VerificationRecord[],
  departureRoutineIds: ReadonlySet<string>,
  now: Date,
  offsetOf: UtcOffsetMinutes = deviceUtcOffset,
): DepartureSummary {
  const departures = departureRecords(records, departureRoutineIds);
  const all = emptyCounts();
  for (const { outcome } of datedOutcomes(departures, offsetOf)) addOutcome(all, outcome);
  return {
    currentStreak: globalStreak(departures, now, offsetOf),
    bestStreak: bestStreak(departures, offsetOf),
    last7Days: completionRate(departures, { days: 7 }, now, offsetOf),
    last30Days: completionRate(departures, { days: 30 }, now, offsetOf),
    totalDepartures: all.completed,
    totalRecords: all.total,
    week: weeklySeries(departures, now, offsetOf),
  };
}
