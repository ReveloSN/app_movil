import { useMemo, useState } from 'react';

import { DEFAULT_ITEM_KIND } from './item-kinds';
import { MAX_ITEMS, validateRoutineDraft } from './routine.validation';
import type { CreateRoutineResult, ItemDraft, RoutineDraft, RoutineValidationErrors } from './routines.types';

/** Ítem del formulario con una clave estable para React (no se guarda). */
export interface ItemFormEntry extends ItemDraft {
  key: string;
}

interface UseRoutineFormOptions {
  createRoutine(draft: RoutineDraft): Promise<CreateRoutineResult>;
  onSaved(): void;
}

const NO_ERRORS: RoutineValidationErrors = {};

// Contador de módulo: solo genera claves únicas para React, no participa en el render.
let entrySeed = 0;
const newEntry = (): ItemFormEntry => ({ key: `item-${entrySeed++}`, label: '', kind: DEFAULT_ITEM_KIND, critical: false });

/** Estado local del formulario de rutina. Lo escrito se conserva si el guardado falla. */
export function useRoutineForm({ createRoutine, onSaved }: UseRoutineFormOptions) {
  const [name, setName] = useState('');
  const [items, setItems] = useState<ItemFormEntry[]>(() => [newEntry()]);
  // Los errores se muestran tras el primer intento de guardar y luego se actualizan en vivo.
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const draft = useMemo<RoutineDraft>(
    () => ({ name, items: items.map(({ label, kind, critical }) => ({ label, kind, critical })) }),
    [name, items],
  );
  const errors = useMemo(() => (attempted ? validateRoutineDraft(draft) : NO_ERRORS), [attempted, draft]);

  const canAddItem = items.length < MAX_ITEMS;

  function addItem() {
    if (canAddItem) setItems((current) => [...current, newEntry()]);
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function updateItem(key: string, changes: Partial<ItemDraft>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));
  }

  async function submit() {
    if (submitting) return;
    setAttempted(true);
    setSubmitError(null);

    setSubmitting(true);
    const result = await createRoutine(draft);
    setSubmitting(false);

    if (result.status === 'created') onSaved();
    else if (result.status === 'failed') setSubmitError(result.error);
    // 'invalid': los errores ya se ven porque attempted = true.
  }

  return { name, setName, items, addItem, removeItem, updateItem, canAddItem, errors, submitting, submitError, submit };
}
