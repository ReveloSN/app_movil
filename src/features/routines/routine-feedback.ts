import { routineSavedMessage } from '@/features/triggers/trigger.copy';

import { CHANGES_SAVED } from './routine.copy';
import type { RoutineValidationErrors } from './routines.types';

/**
 * Aviso breve al volver a Inicio tras guardar P04. Al crear: CF-03 con la frase de sus avisos
 * ("Rutina guardada. Te avisaremos cuando salgas de Casa.") o "Rutina guardada."; al editar, "Cambios guardados.".
 */
export function savedRoutineMessage(editing: boolean, triggerPhrases: readonly string[]): string {
  return editing ? CHANGES_SAVED : routineSavedMessage(triggerPhrases);
}

/** Campo al que llevar el foco tras un intento fallido: el primero en el orden de la pantalla. */
export type RoutineErrorField = 'name' | 'items' | 'triggers';

export function firstRoutineError(errors: RoutineValidationErrors): { field: RoutineErrorField; message: string } | null {
  if (errors.name) return { field: 'name', message: errors.name };
  if (errors.items) return { field: 'items', message: errors.items };
  const label = errors.itemLabels ? Object.values(errors.itemLabels)[0] : undefined;
  if (label) return { field: 'items', message: label };
  if (errors.triggers) return { field: 'triggers', message: errors.triggers };
  return null;
}
