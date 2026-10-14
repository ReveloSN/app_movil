import type {
  CheckedItemEntry,
  ChecklistItemState,
  FinishIntent,
  VerificationOutcome,
  VerificationSummary,
} from './checklist.types';

const countChecked = (items: readonly ChecklistItemState[]) => items.filter((item) => item.checked).length;

/**
 * - completed: todos marcados.
 * - skipped: "Omitir por hoy" sin ningún ítem marcado.
 * - partial: cualquier otro caso (incluye "Listo" con ninguno marcado).
 */
export function computeOutcome(items: readonly ChecklistItemState[], intent: FinishIntent): VerificationOutcome {
  const checked = countChecked(items);
  if (items.length > 0 && checked === items.length) return 'completed';
  if (intent === 'skip' && checked === 0) return 'skipped';
  return 'partial';
}

export function summarize(
  items: readonly ChecklistItemState[],
  intent: FinishIntent,
  durationSeconds: number,
): VerificationSummary {
  return {
    outcome: computeOutcome(items, intent),
    checked: countChecked(items),
    total: items.length,
    omittedLabels: items.filter((item) => !item.checked).map((item) => item.label),
    durationSeconds,
  };
}

export const toCheckedEntries = (items: readonly ChecklistItemState[]): CheckedItemEntry[] =>
  items.map(({ id, label, critical, checked }) => ({ itemId: id, label, critical, checked }));

/** Primer ítem crítico sin marcar (dispara DC-02 al tocar "Listo"). */
export const firstUncheckedCritical = (items: readonly ChecklistItemState[]) =>
  items.find((item) => item.critical && !item.checked);
