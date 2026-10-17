import type { Routine } from '@/shared/types/routine.types';
import type { Trigger } from '@/shared/types/trigger.types';
import { parseSqlTime } from '@/shared/utils/formatClock';

export interface NextRoutine {
  routineId: string;
  routineName: string;
  /** Momento local de la próxima vez. */
  at: Date;
}

const DAYS_AHEAD = 7;

/** Próxima vez estrictamente futura de un aviso por horario (días 0 = domingo), en hora local. */
function nextScheduleTime(trigger: Trigger, now: Date): Date | null {
  const time = parseSqlTime(trigger.time);
  const days = trigger.days ?? [];
  if (!time || days.length === 0) return null;
  // Hoy y los 7 días siguientes: así entra la misma hora de hoy dentro de una semana.
  for (let offset = 0; offset <= DAYS_AHEAD; offset += 1) {
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, time.hour, time.minute);
    if (candidate > now && days.includes(candidate.getDay())) return candidate;
  }
  return null;
}

/**
 * P03-2: la rutina activa con el aviso por horario activo más cercano en el futuro. Los avisos de
 * Wi-Fi no tienen hora y no cuentan. null si no hay ninguna programada.
 */
export function findNextRoutine(routines: readonly Routine[], triggers: readonly Trigger[], now: Date): NextRoutine | null {
  const activeRoutines = new Map(routines.filter((routine) => routine.active).map((routine) => [routine.id, routine]));
  let next: NextRoutine | null = null;
  for (const trigger of triggers) {
    const routine = activeRoutines.get(trigger.routineId);
    if (!routine || !trigger.active || trigger.type !== 'schedule') continue;
    const at = nextScheduleTime(trigger, now);
    if (at && (!next || at < next.at)) next = { routineId: routine.id, routineName: routine.name, at };
  }
  return next;
}
