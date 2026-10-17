import type { VerificationRecord } from '@/shared/types/verification-record.types';

const DAY_MS = 24 * 60 * 60_000;

/**
 * Desfase respecto a UTC, en minutos (Bogotá = −300), que regía en un instante dado. Recibe el
 * instante para respetar los cambios de horario de verano donde los haya.
 */
export type UtcOffsetMinutes = (epochMs: number) => number;

/** El de la zona horaria del teléfono (Date#getTimezoneOffset tiene el signo al revés). */
export const deviceUtcOffset: UtcOffsetMinutes = (epochMs) => -new Date(epochMs).getTimezoneOffset();

/** Número de día (desde 1970) de un instante según el calendario local que da `offsetOf`. */
export const localDayNumber = (epochMs: number, offsetOf: UtcOffsetMinutes = deviceUtcOffset) =>
  Math.floor((epochMs + offsetOf(epochMs) * 60_000) / DAY_MS);

/** Desde 2 días seguidos se muestra la racha (P08-4); 1 día no es racha. */
export const MIN_STREAK_SHOWN = 2;

/**
 * Racha de una rutina: días seguidos (según la fecha local del teléfono) con al menos una verificación
 * completa, contando hacia atrás desde hoy o, si hoy aún no hay, desde ayer (no se "pierde" antes de
 * que acabe el día). 0 si la última completa es de antes de ayer. `offsetOf` se inyecta en los tests.
 */
export function routineStreak(
  records: readonly VerificationRecord[],
  routineId: string,
  now: Date,
  offsetOf: UtcOffsetMinutes = deviceUtcOffset,
): number {
  const days = new Set(
    records
      .filter((record) => record.routineId === routineId && record.result === 'completed')
      .map((record) => Date.parse(record.date))
      .filter((time) => !Number.isNaN(time))
      .map((time) => localDayNumber(time, offsetOf)),
  );
  const today = localDayNumber(now.getTime(), offsetOf);
  let day = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}
