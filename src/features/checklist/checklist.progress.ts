import type { ChecklistProgress } from './checklist.types';

/** Avance de 0 a 1; sin ítems es 0 (nunca NaN) y no pasa de 1. */
export function progressRatio({ checked, total }: ChecklistProgress): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(checked / total, 0), 1);
}

/** Todos los ítems marcados (una lista vacía no cuenta como completa). */
export const isAllChecked = ({ checked, total }: ChecklistProgress): boolean => total > 0 && checked >= total;

/** Marcar este ítem (hoy sin marcar) deja la lista completa: es el momento de celebrar. */
export function completesWithToggle(progress: ChecklistProgress, wasChecked: boolean): boolean {
  return !wasChecked && progress.total > 0 && progress.checked + 1 === progress.total;
}
