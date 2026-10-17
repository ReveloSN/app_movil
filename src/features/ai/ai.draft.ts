import { isItemKind } from '@/features/routines/item-kinds';
import { resolveRoutineColor, resolveRoutineIcon } from '@/features/routines/routine-appearance';
import { ITEM_LABEL_MAX_LENGTH, ITEM_NOTE_MAX_LENGTH, MAX_ITEMS, ROUTINE_NAME_MAX_LENGTH } from '@/features/routines/routine.validation';
import type { ItemDraft, RoutineDraft } from '@/features/routines/routines.types';
import type { ScheduleTriggerDraft } from '@/features/triggers/trigger.types';
import type { Weekday } from '@/shared/types/clock.types';
import { parseSqlTime } from '@/shared/utils/formatClock';

import { AiClientError } from './ai.types';

/** Borrador de IA listo para abrir P04 como rutina nueva (nada se guarda hasta "Guardar"). */
export interface AiRoutineSeed {
  draft: RoutineDraft;
  /** Aviso por horario sugerido, listo para P06 (sin `key`: la pone quien lo siembra). */
  schedule: ScheduleTriggerDraft | null;
  /** La IA sugirió avisar al salir del Wi-Fi: la red la elige la persona en P06. */
  suggestsWifiExit: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max).trim() : '');

const WEEKDAYS = new Set([0, 1, 2, 3, 4, 5, 6]);

function toSchedule(trigger: unknown): ScheduleTriggerDraft | null {
  if (!isRecord(trigger) || trigger.type !== 'schedule' || typeof trigger.time !== 'string') return null;
  const time = parseSqlTime(trigger.time);
  const days = Array.isArray(trigger.days)
    ? [...new Set(trigger.days.filter((day): day is Weekday => typeof day === 'number' && WEEKDAYS.has(day)))]
    : [];
  return time && days.length > 0 ? { type: 'schedule', time, days: days.sort((a, b) => a - b) } : null;
}

function toItems(value: unknown): ItemDraft[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .flatMap((entry): ItemDraft[] => {
      if (!isRecord(entry)) return [];
      const label = text(entry.label, ITEM_LABEL_MAX_LENGTH);
      const key = label.toLocaleLowerCase('es');
      if (!label || seen.has(key)) return [];
      seen.add(key);
      const note = text(entry.note, ITEM_NOTE_MAX_LENGTH);
      const type = typeof entry.type === 'string' ? entry.type : null;
      return [{ label, kind: isItemKind(type) ? type : 'carry', critical: entry.critical === true, ...(note ? { note } : {}) }];
    })
    .slice(0, MAX_ITEMS);
}

/**
 * Valida de nuevo, en el teléfono, lo que devolvió el servidor: ícono y color fuera del conjunto caen a
 * los de por defecto, los ítems se recortan a 12 (ER-05) y a 32/60 caracteres. Sin nombre o sin ítems,
 * AiClientError('invalid_output').
 */
export function toRoutineSeed(data: unknown): AiRoutineSeed {
  const draft = isRecord(data) && isRecord(data.draft) ? data.draft : null;
  const name = text(draft?.name, ROUTINE_NAME_MAX_LENGTH);
  const items = toItems(draft?.items);
  if (!draft || !name || items.length === 0) throw new AiClientError('invalid_output');
  return {
    draft: { name, icon: resolveRoutineIcon(text(draft.icon, 40)), color: resolveRoutineColor(text(draft.color, 20)).key, items },
    schedule: toSchedule(draft.trigger),
    suggestsWifiExit: isRecord(draft.trigger) && draft.trigger.type === 'wifi_exit',
  };
}

/** Sugerencias del servidor, revalidadas: textos ≤ 32, sin repetir lo que ya tiene la rutina, máx. 4. */
export function toSuggestions(data: unknown, existing: readonly string[]): string[] {
  const list = isRecord(data) && Array.isArray(data.suggestions) ? data.suggestions : null;
  if (!list) throw new AiClientError('invalid_output');
  const taken = new Set(existing.map((label) => label.trim().toLocaleLowerCase('es')));
  const result: string[] = [];
  for (const entry of list) {
    const label = text(entry, ITEM_LABEL_MAX_LENGTH);
    const key = label.toLocaleLowerCase('es');
    if (!label || taken.has(key)) continue;
    taken.add(key);
    result.push(label);
    if (result.length === 4) break;
  }
  return result;
}
