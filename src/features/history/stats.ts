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
