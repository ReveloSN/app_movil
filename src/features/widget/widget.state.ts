import { toChecklistItems } from '@/features/checklist/checklist.items';
import { findNextRoutine } from '@/features/routines/next-routine';
import type { Item } from '@/shared/types/item.types';
import type { Routine } from '@/shared/types/routine.types';
import type { Trigger } from '@/shared/types/trigger.types';

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
  /** Todos los ítems: el widget hace scroll si no caben. Primero los pendientes, al final los ya marcados. */
  items: WidgetItem[];
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
  // Lo ya marcado baja al final: arriba queda lo que falta.
  const pending = all.filter((item) => !item.checked);
  return {
    routineId: next.routineId,
    routineName: next.routineName,
    items: [...pending, ...all.filter((item) => item.checked)],
    checked: all.length - pending.length,
    total: all.length,
  };
}
