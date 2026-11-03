import { toChecklistItems } from '@/features/checklist/checklist.items';
import { findNextRoutine } from '@/features/routines/next-routine';
import type { Item } from '@/shared/types/item.types';
import type { Routine } from '@/shared/types/routine.types';
import type { Trigger } from '@/shared/types/trigger.types';

/** Ítems que caben en el widget; el resto se resume como "y N más". */
export const MAX_WIDGET_ITEMS = 4;

export interface WidgetItem {
  id: string;
  label: string;
  critical: boolean;
  checked: boolean;
}

/** Lo que muestra el widget: la próxima rutina con sus ítems y cuántos lleva marcados. */
export interface WidgetState {
  routineId: string;
  routineName: string;
  items: WidgetItem[];
  /** Ítems que no caben en el widget. */
  hiddenCount: number;
  checked: number;
  total: number;
}

interface WidgetData {
  routines: readonly Routine[];
  items: readonly Item[];
  triggers: readonly Trigger[];
  /** Ids ya marcados hoy (borrador de la verificación). */
  checkedIds: readonly string[];
  now: Date;
}

/** La rutina activa que toca antes con sus ítems (críticos primero); null si no hay ninguna o no tiene ítems. */
export function buildWidgetState({ routines, items, triggers, checkedIds, now }: WidgetData): WidgetState | null {
  const next = findNextRoutine(routines, triggers, now);
  if (!next) return null;
  const all = toChecklistItems(items.filter((item) => item.routineId === next.routineId)).map((item) => ({
    id: item.id,
    label: item.label,
    critical: item.critical,
    checked: checkedIds.includes(item.id),
  }));
  if (all.length === 0) return null;
  // Los ya marcados dejan sitio a los que faltan: el widget sirve para ver lo pendiente.
  const pending = all.filter((item) => !item.checked);
  const shown = [...pending, ...all.filter((item) => item.checked)].slice(0, MAX_WIDGET_ITEMS);
  return {
    routineId: next.routineId,
    routineName: next.routineName,
    items: shown,
    hiddenCount: all.length - shown.length,
    checked: all.length - pending.length,
    total: all.length,
  };
}
