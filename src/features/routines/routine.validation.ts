import { MAX_TRIGGERS } from '@/features/triggers/trigger.validation';

import type { RoutineDraft, RoutineValidationErrors } from './routines.types';

export const ROUTINE_NAME_MAX_LENGTH = 24;
export const ITEM_LABEL_MAX_LENGTH = 32;
export const ITEM_NOTE_MAX_LENGTH = 60;
export const MIN_ITEMS = 1;
export const MAX_ITEMS = 12;

/** ER-05 */
export const MAX_ITEMS_MESSAGE = 'Máximo 12 ítems. Las listas cortas se revisan más rápido.';

export function validateRoutineDraft({ name, items, triggers = [] }: RoutineDraft): RoutineValidationErrors {
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
    errors.items = MAX_ITEMS_MESSAGE;
  }

  const itemLabels: Record<number, string> = {};
  items.forEach(({ label }, index) => {
    const trimmed = label.trim();
    if (!trimmed) itemLabels[index] = 'Escribe el ítem.';
    else if (trimmed.length > ITEM_LABEL_MAX_LENGTH) itemLabels[index] = `Máximo ${ITEM_LABEL_MAX_LENGTH} caracteres.`;
  });
  if (Object.keys(itemLabels).length > 0) errors.itemLabels = itemLabels;

  if (triggers.length > MAX_TRIGGERS) errors.triggers = `Máximo ${MAX_TRIGGERS} avisos por rutina.`;

  return errors;
}

export interface ItemValidationErrors {
  label?: string;
  note?: string;
}

/** P05: etiqueta* (máx. 32) y nota (máx. 60). */
export function validateItemDraft({ label, note }: { label: string; note: string }): ItemValidationErrors {
  const errors: ItemValidationErrors = {};
  const trimmed = label.trim();
  if (!trimmed) errors.label = 'Escribe el ítem.';
  else if (trimmed.length > ITEM_LABEL_MAX_LENGTH) errors.label = `Máximo ${ITEM_LABEL_MAX_LENGTH} caracteres.`;
  if (note.trim().length > ITEM_NOTE_MAX_LENGTH) errors.note = `Máximo ${ITEM_NOTE_MAX_LENGTH} caracteres.`;
  return errors;
}

export const hasValidationErrors = (errors: RoutineValidationErrors): boolean => Object.keys(errors).length > 0;
