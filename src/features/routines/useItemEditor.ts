import { useMemo, useState } from 'react';

import { stableStringify } from '@/shared/utils/stableStringify';

import { resolveItemIcon } from './item-icons';
import { validateItemDraft, type ItemValidationErrors } from './routine.validation';
import type { ItemDraft } from './routines.types';

const NO_ERRORS: ItemValidationErrors = {};

/**
 * Estado de la hoja P05 para un ítem. Los errores aparecen tras el primer intento de guardar.
 * `dirty` compara con lo que había al abrir (DC-03 al cerrar la hoja).
 */
export function useItemEditor<T extends ItemDraft>(initial: T) {
  const [label, setLabel] = useState(initial.label);
  const [icon, setIcon] = useState<string>(resolveItemIcon(initial.icon).icon);
  const [kind, setKind] = useState(initial.kind);
  const [critical, setCritical] = useState(initial.critical);
  const [note, setNote] = useState(initial.note ?? '');
  const [attempted, setAttempted] = useState(false);

  const current = useMemo(() => ({ label, icon, kind, critical, note }), [label, icon, kind, critical, note]);
  const [initialFingerprint] = useState(() => stableStringify(current));
  const dirty = stableStringify(current) !== initialFingerprint;
  const errors = useMemo(() => (attempted ? validateItemDraft(current) : NO_ERRORS), [attempted, current]);

  /** El ítem listo para la lista, o null si no pasa la validación (los errores quedan a la vista). */
  function commit(): T | null {
    setAttempted(true);
    if (Object.keys(validateItemDraft(current)).length > 0) return null;
    return { ...initial, label: label.trim(), icon, kind, critical, note: note.trim() || undefined };
  }

  return { label, setLabel, icon, setIcon, kind, setKind, critical, setCritical, note, setNote, errors, dirty, commit };
}
