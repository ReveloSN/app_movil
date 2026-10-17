import type { TriggerDraftEntry } from '@/features/triggers/trigger.types';
import type { Routine } from '@/shared/types/routine.types';

import type { RoutineOriginal } from './routine-edit.service';

/** Valor guardado en items.type. */
export type ItemKind = 'carry' | 'do' | 'check';

export interface ItemDraft {
  /** Id del ítem guardado (solo en edición). */
  id?: string;
  label: string;
  kind: ItemKind;
  critical: boolean;
}

export interface RoutineDraft {
  name: string;
  /** Nombre de ícono de Ionicons (04-2). Sin él, se guarda el de por defecto (nunca null). */
  icon?: string;
  /** Clave de color de 04-2 (ej. "green"). Sin ella, se guarda la de por defecto. */
  color?: string;
  items: ItemDraft[];
  /** Avisos configurados en P06 (0–3). En edición, la clave de los ya guardados es su id. */
  triggers?: TriggerDraftEntry[];
}

export interface RoutineValidationErrors {
  name?: string;
  /** Error de la lista completa (cantidad de ítems). */
  items?: string;
  /** Error de etiqueta por posición del ítem. */
  itemLabels?: Record<number, string>;
  /** Cantidad de avisos. */
  triggers?: string;
}

/** Resultado de crear o editar una rutina. */
export type SaveRoutineResult =
  | { status: 'saved'; routine: Routine }
  | { status: 'invalid'; errors: RoutineValidationErrors }
  | { status: 'failed'; error: string };

export type DeleteRoutineResult = { status: 'deleted' } | { status: 'failed'; error: string };

export interface RoutinesContextValue {
  routines: Routine[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  createRoutine(draft: RoutineDraft): Promise<SaveRoutineResult>;
  updateRoutine(routineId: string, draft: RoutineDraft, original: RoutineOriginal): Promise<SaveRoutineResult>;
  deleteRoutine(routineId: string): Promise<DeleteRoutineResult>;
}
