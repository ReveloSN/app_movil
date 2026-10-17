// Validación y saneamiento de lo que devuelve el modelo (servidor). Nunca se confía en él.

import {
  AiError,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  ITEM_TYPES,
  OUTPUT_LIMITS,
  ROUTINE_COLORS,
  ROUTINE_ICONS,
  type DraftItem,
  type DraftTrigger,
  type ItemType,
  type RoutineColor,
  type RoutineDraft,
  type RoutineIcon,
} from './contract.ts';
import { cleanText, clip, itemKey } from './text.ts';

const invalid = (message: string): never => {
  throw new AiError('invalid_output', message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const textOf = (value: unknown, max: number): string => (typeof value === 'string' ? clip(cleanText(value), max) : '');

const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  options.find((option) => option === value) ?? fallback;

/** El JSON del modelo; tolera que venga dentro de un bloque ```json. */
export function parseModelJson(text: string): Record<string, unknown> {
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try {
    const parsed: unknown = JSON.parse(unfenced);
    if (isRecord(parsed)) return parsed;
  } catch {
    // Se informa abajo.
  }
  return invalid('La respuesta del modelo no es un objeto JSON.');
}

/** El modelo dijo que el texto no es una rutina. */
function rejectIfNotARoutine(raw: Record<string, unknown>) {
  if (raw.status === 'not_a_routine') throw new AiError('not_a_routine', 'El texto no describe una rutina.');
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

function sanitizeTrigger(value: unknown): DraftTrigger | undefined {
  if (!isRecord(value)) return undefined;
  if (value.type === 'wifi_exit') return { type: 'wifi_exit' };
  if (value.type !== 'schedule' || typeof value.time !== 'string') return undefined;
  const time = value.time.trim().padStart(5, '0'); // "7:30" → "07:30"
  if (!TIME.test(time) || !Array.isArray(value.days)) return undefined;
  const days = [...new Set(value.days.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6))];
  return days.length > 0 ? { type: 'schedule', time, days: days.sort((a, b) => a - b) } : undefined;
}

function sanitizeItems(value: unknown): DraftItem[] {
  if (!Array.isArray(value)) return invalid('El borrador no trae una lista de ítems.');
  const seen = new Set<string>();
  const items: DraftItem[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const label = textOf(entry.label, OUTPUT_LIMITS.itemLabel);
    const key = itemKey(label);
    if (!label || seen.has(key)) continue;
    seen.add(key);
    const note = textOf(entry.note, OUTPUT_LIMITS.itemNote);
    items.push({
      label,
      type: oneOf<ItemType>(ITEM_TYPES, entry.type, 'carry'),
      critical: entry.critical === true,
      ...(note ? { note } : {}),
    });
    if (items.length === OUTPUT_LIMITS.draftItemsMax) break;
  }
  if (items.length < OUTPUT_LIMITS.draftItemsMin) invalid('El borrador no trae ningún ítem válido.');
  return items;
}

/** Borrador listo para la app: textos limpios y recortados, valores de los conjuntos cerrados, 1–8 ítems. */
export function sanitizeDraft(raw: Record<string, unknown>): RoutineDraft {
  rejectIfNotARoutine(raw);
  const name = textOf(raw.name, OUTPUT_LIMITS.name);
  if (!name) invalid('El borrador no trae nombre.');
  const trigger = sanitizeTrigger(raw.trigger);
  return {
    name,
    icon: oneOf<RoutineIcon>(ROUTINE_ICONS, raw.icon, DEFAULT_ICON),
    color: oneOf<RoutineColor>(ROUTINE_COLORS, raw.color, DEFAULT_COLOR),
    items: sanitizeItems(raw.items),
    ...(trigger ? { trigger } : {}),
  };
}

/** Hasta 4 sugerencias limpias, sin duplicados y sin repetir lo que la rutina ya tiene. */
export function sanitizeSuggestions(raw: Record<string, unknown>, existing: readonly string[]): string[] {
  rejectIfNotARoutine(raw);
  if (!Array.isArray(raw.suggestions)) return invalid('La respuesta no trae una lista de sugerencias.');
  const taken = new Set(existing.map(itemKey));
  const result: string[] = [];
  for (const entry of raw.suggestions) {
    const label = textOf(entry, OUTPUT_LIMITS.itemLabel);
    const key = itemKey(label);
    if (!label || taken.has(key)) continue;
    taken.add(key);
    result.push(label);
    if (result.length === OUTPUT_LIMITS.suggestions) break;
  }
  return result;
}
