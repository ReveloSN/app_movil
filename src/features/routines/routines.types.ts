import type { Routine } from '@/shared/types/routine.types';

/** Valor guardado en items.type. */
export type ItemKind = 'carry' | 'do' | 'check';

export interface ItemDraft {
  label: string;
  kind: ItemKind;
  critical: boolean;
}

export interface RoutineDraft {
  name: string;
  items: ItemDraft[];
}

export interface RoutineValidationErrors {
  name?: string;
  /** Error de la lista completa (cantidad de ítems). */
  items?: string;
  /** Error de etiqueta por posición del ítem. */
  itemLabels?: Record<number, string>;
}

export type CreateRoutineResult =
  | { status: 'created'; routine: Routine }
  | { status: 'invalid'; errors: RoutineValidationErrors }
  | { status: 'failed'; error: string };

export interface RoutinesContextValue {
  routines: Routine[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  createRoutine(draft: RoutineDraft): Promise<CreateRoutineResult>;
}
