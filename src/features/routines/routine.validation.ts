import type { RoutineDraft, RoutineValidationErrors } from './routines.types';

export const ROUTINE_NAME_MAX_LENGTH = 24;
export const ITEM_LABEL_MAX_LENGTH = 32;
export const MIN_ITEMS = 1;
export const MAX_ITEMS = 12;

export function validateRoutineDraft({ name, items }: RoutineDraft): RoutineValidationErrors {
  const errors: RoutineValidationErrors = {};
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = 'Ponle un nombre a la rutina.';
  } else if (trimmedName.length > ROUTINE_NAME_MAX_LENGTH) {
    errors.name = `Máximo ${ROUTINE_NAME_MAX_LENGTH} caracteres.`;
  }

  if (items.length < MIN_ITEMS) {
    errors.items = 'Añade al menos un ítem.';
  } else if (items.length > MAX_ITEMS) {
    errors.items = `Máximo ${MAX_ITEMS} ítems por rutina.`;
  }

  const itemLabels: Record<number, string> = {};
  items.forEach(({ label }, index) => {
    const trimmed = label.trim();
    if (!trimmed) itemLabels[index] = 'Escribe el ítem.';
    else if (trimmed.length > ITEM_LABEL_MAX_LENGTH) itemLabels[index] = `Máximo ${ITEM_LABEL_MAX_LENGTH} caracteres.`;
  });
  if (Object.keys(itemLabels).length > 0) errors.itemLabels = itemLabels;

  return errors;
}

export const hasValidationErrors = (errors: RoutineValidationErrors): boolean => Object.keys(errors).length > 0;
