import { parseCheckedItems } from '@/features/history/history.filter';
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

/** Umbrales (Documento de la tarea): fáciles de ajustar en un solo sitio. */
export const PATTERN_RULES = {
  recentDays: 14,
  recentMisses: 3,
  missRatio: 0.4,
  /** Con menos verificaciones el porcentaje no dice nada (1 de 2 no es un patrón). */
  minObservationsForRatio: 5,
  weekdayMisses: 3,
  weekdayObservations: 4,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Clave para agrupar un ítem dentro de su rutina, sin mayúsculas ni tildes. */
export const itemKey = (label: string) =>
  label
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Clave estable de un patrón (para no insistir y para la caché de la IA). */
export const patternKey = (pattern: OmissionPattern) =>
  [pattern.kind, pattern.routineId, itemKey(pattern.label), pattern.kind === 'weekday' ? pattern.weekday : ''].join('|');

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
export function detectPatterns(records: readonly VerificationRecord[], now: Date): OmissionPattern[] {
  const recentFrom = now.getTime() - PATTERN_RULES.recentDays * DAY_MS;
  const tallies = new Map<string, Tally & { routineId: string }>();

  for (const record of records) {
    const at = Date.parse(record.date);
    if (!Number.isFinite(at) || at > now.getTime()) continue;
    const weekday = new Date(at).getDay();
    for (const item of parseCheckedItems(record.itemsChecked)) {
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
