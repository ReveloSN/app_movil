import type { Routine } from '@/shared/types/routine.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { toLocalDayKey } from './history.dates';
import type { HistoryEntry, HistoryGroup } from './history.types';

/** Para registros cuya rutina ya no está en la lista del usuario. */
export const UNKNOWN_ROUTINE_NAME = 'Rutina eliminada';

/**
 * Agrupa los registros por día local, del más reciente al más antiguo (días y registros),
 * resolviendo el nombre e ícono de cada rutina. Los registros con fecha inválida se descartan.
 */
export function groupRecordsByDay(
  records: readonly VerificationRecord[],
  routines: readonly Routine[],
): HistoryGroup[] {
  const routinesById = new Map(routines.map((routine) => [routine.id, routine]));

  const sorted = records
    .map((record) => ({ record, time: new Date(record.date).getTime() }))
    .filter(({ time }) => !Number.isNaN(time))
    .sort((a, b) => b.time - a.time);

  const groups: HistoryGroup[] = [];
  for (const { record, time } of sorted) {
    const routine = routinesById.get(record.routineId);
    const entry: HistoryEntry = {
      ...record,
      routineName: routine?.name ?? UNKNOWN_ROUTINE_NAME,
      routineIcon: routine?.icon ?? null,
    };

    const date = toLocalDayKey(new Date(time));
    const last = groups[groups.length - 1];
    if (last?.date === date) last.records.push(entry);
    else groups.push({ date, records: [entry] });
  }
  return groups;
}
