import { parseCheckedItems } from '@/features/history/history.filter';
import { deviceUtcOffset, localDayNumber, type UtcOffsetMinutes } from '@/features/history/history.streak';
import type { ForgotEvent } from '@/shared/types/forgot-event.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

/** Un olvido que se repite, con sus conteos (los mismos datos que luego viajan, agregados, a la IA). */
export type OmissionPattern =
  | {
      kind: 'item';
      routineId: string;
      /** Etiqueta tal como se ve en la rutina (la más reciente). */
      label: string;
      /** Omisiones en la ventana reciente (14 días) y en todo el historial disponible. */
      recentMisses: number;
      misses: number;
      observations: number;
      critical: boolean;
    }
  | {
      kind: 'weekday';
      routineId: string;
      label: string;
      /** 0 = domingo … 6 = sábado. */
      weekday: number;
      misses: number;
      observations: number;
      critical: boolean;
    };

/** Un ítem anotado con "Olvidé algo" que se repite el mismo día de la semana. */
export interface ForgotPattern {
  kind: 'forgot_weekday';
  routineId: string;
  /** Etiqueta tal como la escribió la persona la última vez. */
  label: string;
  /** 0 = domingo … 6 = sábado, en la hora local del teléfono. */
  weekday: number;
  /** Días (ese día de la semana, en la ventana) con el olvido anotado. */
  misses: number;
  /** Salidas ese día de la semana en la ventana: días con verificación de la rutina o con un olvido. */
  observations: number;
}

/** Cualquier patrón que puede convertirse en una sugerencia. */
export type InsightPattern = OmissionPattern | ForgotPattern;

/** Umbrales (Documento de la tarea): fáciles de ajustar en un solo sitio. */
export const PATTERN_RULES = {
  recentDays: 14,
  recentMisses: 3,
  missRatio: 0.4,
  /** Con menos verificaciones el porcentaje no dice nada (1 de 2 no es un patrón). */
  minObservationsForRatio: 5,
  weekdayMisses: 3,
  weekdayObservations: 4,
  /** "Olvidé algo": ventana en semanas y mínimos de olvidos y de salidas ese día de la semana. */
  forgotWeeks: 8,
  forgotMisses: 3,
  forgotOutings: 4,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Clave para agrupar un ítem dentro de su rutina: sin mayúsculas, sin tildes y con un solo espacio. */
export const itemKey = (label: string) =>
  label
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Clave estable de un patrón (para no insistir y para la caché de la IA). */
export const patternKey = (pattern: InsightPattern) =>
  [pattern.kind, pattern.routineId, itemKey(pattern.label), pattern.kind === 'item' ? '' : pattern.weekday].join('|');

/** Día de la semana (0 = domingo) de un instante en el calendario local que da `offsetOf`. El 1/1/1970 fue jueves. */
export const localWeekday = (epochMs: number, offsetOf: UtcOffsetMinutes = deviceUtcOffset) =>
  (((localDayNumber(epochMs, offsetOf) + 4) % 7) + 7) % 7;

interface Tally {
  label: string;
  last: number;
  critical: boolean;
  misses: number;
  observations: number;
  recentMisses: number;
  byWeekday: { misses: number; observations: number }[];
}

/**
 * Detector DETERMINISTA (sin IA) de olvidos que se repiten, por rutina e ítem:
 * - ítem: omitido ≥ 3 veces en los últimos 14 días, o en ≥ 40 % de sus verificaciones (con ≥ 5);
 * - día de la semana: ≥ 3 omisiones el mismo día con ≥ 4 verificaciones ese día.
 * Solo cuentan las verificaciones que traen la lista de ítems (las omitidas desde la notificación no).
 * Los ítems que ya son críticos se informan igual (`critical`), pero quien sugiere puede filtrarlos.
 */
export function detectPatterns(
  records: readonly VerificationRecord[],
  now: Date,
  offsetOf: UtcOffsetMinutes = deviceUtcOffset,
): OmissionPattern[] {
  const recentFrom = now.getTime() - PATTERN_RULES.recentDays * DAY_MS;
  const tallies = new Map<string, Tally & { routineId: string }>();

  for (const record of records) {
    const at = Date.parse(record.date);
    if (!Number.isFinite(at) || at > now.getTime()) continue;
    const weekday = localWeekday(at, offsetOf);
    for (const item of parseCheckedItems(record.itemsChecked)) {
      // Los ítems temporales (ej. "Paraguas" por el clima) no son de la rutina: no forman patrones.
      if (item.origin) continue;
      const key = `${record.routineId}|${itemKey(item.label)}`;
      let tally = tallies.get(key);
      if (!tally) {
        tally = {
          routineId: record.routineId,
          label: item.label,
          last: at,
          critical: item.critical,
          misses: 0,
          observations: 0,
          recentMisses: 0,
          byWeekday: Array.from({ length: 7 }, () => ({ misses: 0, observations: 0 })),
        };
        tallies.set(key, tally);
      }
      if (at >= tally.last) Object.assign(tally, { last: at, label: item.label, critical: item.critical });
      tally.observations += 1;
      tally.byWeekday[weekday].observations += 1;
      if (!item.checked) {
        tally.misses += 1;
        tally.byWeekday[weekday].misses += 1;
        if (at >= recentFrom) tally.recentMisses += 1;
      }
    }
  }

  const patterns: OmissionPattern[] = [];
  for (const tally of tallies.values()) {
    const { routineId, label, critical, misses, observations, recentMisses } = tally;
    const frequent =
      recentMisses >= PATTERN_RULES.recentMisses ||
      (observations >= PATTERN_RULES.minObservationsForRatio && misses / observations >= PATTERN_RULES.missRatio);
    if (frequent) patterns.push({ kind: 'item', routineId, label, recentMisses, misses, observations, critical });

    tally.byWeekday.forEach((day, weekday) => {
      if (day.misses >= PATTERN_RULES.weekdayMisses && day.observations >= PATTERN_RULES.weekdayObservations) {
        patterns.push({ kind: 'weekday', routineId, label, weekday, misses: day.misses, observations: day.observations, critical });
      }
    });
  }

  // Lo más repetido primero; a igualdad, el patrón general antes que el de un día.
  return patterns.sort((a, b) => b.misses / b.observations - a.misses / a.observations || (a.kind === 'item' ? -1 : 1));
}

interface ForgotTally {
  routineId: string;
  label: string;
  last: number;
  /** Días locales con el olvido anotado. */
  days: Set<number>;
}

/**
 * Detector DETERMINISTA (sin IA) de "Olvidé algo": el mismo ítem (etiqueta sin mayúsculas, tildes ni
 * espacios de más) olvidado ≥ 3 días el mismo día de la semana en las últimas 8 semanas, con ≥ 4 salidas
 * ese día (días con verificación de la rutina o con un olvido anotado: un olvido implica que se salió).
 * Todo en días locales de `offsetOf` (una salida a las 23:30 cuenta en su día, no en el siguiente en UTC).
 * Varios olvidos del mismo ítem el mismo día cuentan una vez. Con `routineIds`, se ignoran los olvidos y
 * verificaciones de rutinas que ya no existen.
 */
export function detectForgotPatterns(
  events: readonly ForgotEvent[],
  records: readonly VerificationRecord[],
  now: Date,
  offsetOf: UtcOffsetMinutes = deviceUtcOffset,
  routineIds?: ReadonlySet<string>,
): ForgotPattern[] {
  const today = localDayNumber(now.getTime(), offsetOf);
  const firstDay = today - PATTERN_RULES.forgotWeeks * 7 + 1;
  const exists = (routineId: string) => !routineIds || routineIds.has(routineId);
  /** Día local dentro de la ventana, o null. */
  const dayOf = (iso: string): { day: number; at: number } | null => {
    const at = Date.parse(iso);
    if (!Number.isFinite(at)) return null;
    const day = localDayNumber(at, offsetOf);
    return day >= firstDay && day <= today ? { day, at } : null;
  };

  // Salidas por rutina: días locales en la ventana.
  const outings = new Map<string, Set<number>>();
  const addOuting = (routineId: string, day: number) => {
    const days = outings.get(routineId) ?? new Set<number>();
    days.add(day);
    outings.set(routineId, days);
  };
  for (const record of records) {
    const when = exists(record.routineId) ? dayOf(record.date) : null;
    if (when) addOuting(record.routineId, when.day);
  }

  const tallies = new Map<string, ForgotTally>();
  for (const event of events) {
    const key = itemKey(event.label);
    const when = key && exists(event.routineId) ? dayOf(event.date) : null;
    if (!when) continue;
    addOuting(event.routineId, when.day);
    const id = `${event.routineId}|${key}`;
    const label = event.label.trim().replace(/\s+/g, ' ');
    const tally = tallies.get(id) ?? { routineId: event.routineId, label, last: when.at, days: new Set<number>() };
    if (when.at >= tally.last) Object.assign(tally, { last: when.at, label });
    tally.days.add(when.day);
    tallies.set(id, tally);
  }

  const weekdayOfDay = (day: number) => (((day + 4) % 7) + 7) % 7;
  const patterns: ForgotPattern[] = [];
  for (const { routineId, label, days } of tallies.values()) {
    const routineOutings = [...(outings.get(routineId) ?? [])];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const misses = [...days].filter((day) => weekdayOfDay(day) === weekday).length;
      if (misses < PATTERN_RULES.forgotMisses) continue;
      const observations = routineOutings.filter((day) => weekdayOfDay(day) === weekday).length;
      if (observations >= PATTERN_RULES.forgotOutings) {
        patterns.push({ kind: 'forgot_weekday', routineId, label, weekday, misses, observations });
      }
    }
  }
  return patterns.sort((a, b) => b.misses / b.observations - a.misses / a.observations || b.misses - a.misses);
}
