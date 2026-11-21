import { MAX_TRIGGERS } from '@/features/triggers/trigger.validation';

import copy from './routine.copy';
import type { RoutineDraft, RoutineValidationErrors } from './routines.types';

export const ROUTINE_NAME_MAX_LENGTH = 24;
export const ITEM_LABEL_MAX_LENGTH = 32;
export const ITEM_NOTE_MAX_LENGTH = 60;
export const MIN_ITEMS = 1;
export const MAX_ITEMS = 12;

export function validateRoutineDraft({ name, items, triggers = [] }: RoutineDraft): RoutineValidationErrors {
  const errors: RoutineValidationErrors = {};
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = copy.NAME_REQUIRED;
  } else if (trimmedName.length > ROUTINE_NAME_MAX_LENGTH) {
    errors.name = copy.maxCharacters(ROUTINE_NAME_MAX_LENGTH);
  }

  if (items.length < MIN_ITEMS) {
    errors.items = copy.ITEMS_REQUIRED;
  } else if (items.length > MAX_ITEMS) {
    errors.items = copy.MAX_ITEMS_MESSAGE;
  }

  const itemLabels: Record<number, string> = {};
  items.forEach(({ label }, index) => {
    const trimmed = label.trim();
    if (!trimmed) itemLabels[index] = copy.ITEM_REQUIRED;
    else if (trimmed.length > ITEM_LABEL_MAX_LENGTH) itemLabels[index] = copy.maxCharacters(ITEM_LABEL_MAX_LENGTH);
  });
  if (Object.keys(itemLabels).length > 0) errors.itemLabels = itemLabels;

  if (triggers.length > MAX_TRIGGERS) errors.triggers = copy.maxTriggers(MAX_TRIGGERS);

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
  if (!trimmed) errors.label = copy.ITEM_REQUIRED;
  else if (trimmed.length > ITEM_LABEL_MAX_LENGTH) errors.label = copy.maxCharacters(ITEM_LABEL_MAX_LENGTH);
  if (note.trim().length > ITEM_NOTE_MAX_LENGTH) errors.note = copy.maxCharacters(ITEM_NOTE_MAX_LENGTH);
  return errors;
}

export const hasValidationErrors = (errors: RoutineValidationErrors): boolean => Object.keys(errors).length > 0;
