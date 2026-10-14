import type { Weekday } from '@/shared/types/clock.types';
import type { HomeNetwork } from '@/shared/types/home-network.types';
import type { CreateTriggerInput, Trigger, UpdateTriggerInput } from '@/shared/types/trigger.types';
import { parseSqlTime, toSqlTime } from '@/shared/utils/formatClock';

import { isTriggerKind } from './strategies';
import type { TriggerDraft } from './trigger.types';

/**
 * Columnas de un aviso. Todas explícitas (null las que no aplican): así un UPDATE que cambia
 * de Wi-Fi a horario no deja la red vieja guardada. Los de Wi-Fi apuntan a `home_networks`.
 */
export function toTriggerColumns(draft: TriggerDraft, networkId: string | null): UpdateTriggerInput {
  if (draft.type === 'schedule') {
    return {
      type: draft.type,
      time: toSqlTime(draft.time),
      days: draft.days,
      networkId: null,
      windowStart: null,
      windowEnd: null,
      active: true,
    };
  }
  return {
    type: draft.type,
    time: null,
    days: null,
    networkId,
    windowStart: draft.window ? toSqlTime(draft.window.start) : null,
    windowEnd: draft.window ? toSqlTime(draft.window.end) : null,
    active: true,
  };
}

/** Fila a insertar en `triggers`. */
export const toCreateTriggerInput = (routineId: string, draft: TriggerDraft, networkId: string | null): CreateTriggerInput => ({
  routineId,
  type: draft.type,
  ...toTriggerColumns(draft, networkId),
});

const isWeekday = (value: number): value is Weekday => Number.isInteger(value) && value >= 0 && value <= 6;

/** Reconstruye el borrador desde la base de datos. null si la fila está incompleta (se ignora). */
export function fromTriggerRow(trigger: Trigger, networks: ReadonlyMap<string, HomeNetwork>): TriggerDraft | null {
  if (!isTriggerKind(trigger.type)) return null;

  if (trigger.type === 'schedule') {
    const time = parseSqlTime(trigger.time);
    const days = (trigger.days ?? []).filter(isWeekday);
    return time && days.length > 0 ? { type: 'schedule', time, days } : null;
  }

  const network = trigger.networkId ? networks.get(trigger.networkId) : undefined;
  if (!network) return null;
  const start = parseSqlTime(trigger.windowStart);
  const end = parseSqlTime(trigger.windowEnd);
  return {
    type: trigger.type,
    ssid: network.ssid,
    networkName: network.displayName,
    window: start && end ? { start, end } : null,
  };
}
