import { isWithinWindow } from '@/features/triggers/strategies/wifi.strategy';
import type { WifiTriggerKind } from '@/features/triggers/trigger.types';
import type { Routine } from '@/shared/types/routine.types';
import type { Trigger } from '@/shared/types/trigger.types';
import { parseSqlTime } from '@/shared/utils/formatClock';

import { departureRoutines } from './routine-list';

interface NextRoutineBase {
  routineId: string;
  routineName: string;
}

/** Por horario (con su momento local) o por Wi-Fi (sin hora: avisa al salir o llegar). */
export type NextRoutine = (NextRoutineBase & { kind: 'schedule'; at: Date }) | (NextRoutineBase & { kind: WifiTriggerKind });

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

const isWifiKind = (type: string): type is WifiTriggerKind => type === 'wifi_exit' || type === 'wifi_enter';

/** Franja del aviso por Wi-Fi, o null si no tiene (avisa a cualquier hora). */
function wifiWindow(trigger: Trigger) {
  const start = parseSqlTime(trigger.windowStart);
  const end = parseSqlTime(trigger.windowEnd);
  return start && end ? { start, end } : null;
}

/**
 * P03-2: la rutina de salida activa que toca antes, con avisos activos. Orden de prioridad:
 * 1. un aviso por Wi-Fi con franja que cubre este momento (avisaría ya mismo);
 * 2. el aviso por horario más cercano en el futuro;
 * 3. un aviso por Wi-Fi sin franja (sin hora que comparar, solo si no hay horario).
 * Un aviso por Wi-Fi con franja que no cubre este momento no cuenta. null si no hay ninguno.
 */
export function findNextRoutine(routines: readonly Routine[], triggers: readonly Trigger[], now: Date): NextRoutine | null {
  // Las de llegada no son «la próxima salida»: se avisan al volver a casa, no se preparan antes de salir.
  const activeRoutines = new Map(departureRoutines(routines).filter((routine) => routine.active).map((routine) => [routine.id, routine]));
  let scheduled: NextRoutine | null = null;
  let wifiInWindow: NextRoutine | null = null;
  let wifiAnytime: NextRoutine | null = null;
  for (const trigger of triggers) {
    const routine = activeRoutines.get(trigger.routineId);
    if (!routine || !trigger.active) continue;
    const base = { routineId: routine.id, routineName: routine.name };
    if (trigger.type === 'schedule') {
      const at = nextScheduleTime(trigger, now);
      if (at && (!scheduled || scheduled.kind !== 'schedule' || at < scheduled.at)) scheduled = { ...base, kind: 'schedule', at };
    } else if (isWifiKind(trigger.type)) {
      const window = wifiWindow(trigger);
      if (!window) wifiAnytime ??= { ...base, kind: trigger.type };
      else if (isWithinWindow(window, now)) wifiInWindow ??= { ...base, kind: trigger.type };
    }
  }
  return wifiInWindow ?? scheduled ?? wifiAnytime;
}
