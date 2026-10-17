import { sortCriticalFirst } from '@/features/routines/item-order';
import type { Item } from '@/shared/types/item.types';

import type { ChecklistItemState } from './checklist.types';

/** Ítems de P07 sin marcar, con los críticos arriba (Documento de Jerarquía) y su nota (07-5). */
export const toChecklistItems = (items: readonly Item[]): ChecklistItemState[] =>
  sortCriticalFirst(items).map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    critical: item.critical,
    note: item.note?.trim() || null,
    checked: false,
  }));
