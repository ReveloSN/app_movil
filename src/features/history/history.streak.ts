import type { VerificationRecord } from '@/shared/types/verification-record.types';

/**
 * America/Bogota es UTC−5 todo el año (Colombia no tiene horario de verano): el día local se calcula
 * con ese desfase fijo, sin depender de la zona horaria del teléfono ni del soporte de Intl del motor JS.
 */
const BOGOTA_OFFSET_MS = -5 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

/** Número de día (desde 1970) de una fecha según el calendario de Bogotá. */
export const bogotaDayNumber = (epochMs: number) => Math.floor((epochMs + BOGOTA_OFFSET_MS) / DAY_MS);

/** Desde 2 días seguidos se muestra la racha (P08-4); 1 día no es racha. */
export const MIN_STREAK_SHOWN = 2;

/**
 * Racha de una rutina: días seguidos (en Bogotá) con al menos una verificación completa, contando
 * hacia atrás desde hoy o, si hoy aún no hay, desde ayer (no se "pierde" antes de que acabe el día).
 * 0 si la última completa es de antes de ayer.
 */
export function routineStreak(records: readonly VerificationRecord[], routineId: string, now: Date): number {
  const days = new Set(
    records
      .filter((record) => record.routineId === routineId && record.result === 'completed')
      .map((record) => Date.parse(record.date))
      .filter((time) => !Number.isNaN(time))
      .map(bogotaDayNumber),
  );
  const today = bogotaDayNumber(now.getTime());
  let day = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}
