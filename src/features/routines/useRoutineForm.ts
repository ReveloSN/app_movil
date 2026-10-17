import { useMemo, useState } from 'react';

import type { TriggerDraftEntry } from '@/features/triggers/trigger.types';

import { DEFAULT_ITEM_KIND } from './item-kinds';
import { draftFingerprint, toRoutineDraft } from './routine.draft';
import { MAX_ITEMS, validateRoutineDraft } from './routine.validation';
import type { ItemDraft, RoutineDraft, RoutineValidationErrors, SaveRoutineResult } from './routines.types';

/** Ítem del formulario con una clave estable para React (no se guarda). En edición trae su `id`. */
export interface ItemFormEntry extends ItemDraft {
  key: string;
}

interface UseRoutineFormOptions {
  /** Crea o actualiza según el modo de P04. */
  save(draft: RoutineDraft): Promise<SaveRoutineResult>;
  onSaved(): void;
  /** Borrador precargado (ej. desde una plantilla). Solo se lee al montar. */
  initialDraft?: RoutineDraft;
  /** Avisos configurados en P06 (viven fuera del formulario: los edita otra pantalla). */
  triggers?: readonly TriggerDraftEntry[];
}

const NO_ERRORS: RoutineValidationErrors = {};
const NO_TRIGGERS: readonly TriggerDraftEntry[] = [];

// Contador de módulo: solo genera claves únicas para React, no participa en el render.
let entrySeed = 0;
const newEntry = (item: ItemDraft = { label: '', kind: DEFAULT_ITEM_KIND, critical: false }): ItemFormEntry => ({
  key: `item-${entrySeed++}`,
  ...item,
});

const initialEntries = (draft: RoutineDraft | undefined): ItemFormEntry[] =>
  draft && draft.items.length > 0 ? draft.items.map(newEntry) : [newEntry()];

/** Estado local del formulario de rutina. Lo escrito se conserva si el guardado falla. */
export function useRoutineForm({ save, onSaved, initialDraft, triggers = NO_TRIGGERS }: UseRoutineFormOptions) {
  const [name, setName] = useState(initialDraft?.name ?? '');
  // Sin selector de ícono todavía (04-2): solo se conserva el que venga precargado.
  const [icon] = useState(initialDraft?.icon);
  const [startItems] = useState<ItemFormEntry[]>(() => initialEntries(initialDraft));
  const [items, setItems] = useState<ItemFormEntry[]>(startItems);
  // Lo que había al abrir (también los avisos ya sembrados): base para saber si hay cambios (DC-03).
  const [initialFingerprint] = useState(() =>
    draftFingerprint(toRoutineDraft({ name: initialDraft?.name ?? '', icon: initialDraft?.icon, items: startItems, triggers })),
  );
  // Los errores se muestran tras el primer intento de guardar y luego se actualizan en vivo.
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const draft = useMemo<RoutineDraft>(() => toRoutineDraft({ name, icon, items, triggers }), [name, icon, items, triggers]);
  const dirty = useMemo(() => draftFingerprint(draft) !== initialFingerprint, [draft, initialFingerprint]);
  const errors = useMemo(() => (attempted ? validateRoutineDraft(draft) : NO_ERRORS), [attempted, draft]);

  const canAddItem = items.length < MAX_ITEMS;

  function addItem() {
    if (canAddItem) setItems((current) => [...current, newEntry()]);
  }

  /** Sugerencia (04-4): ocupa el primer ítem vacío o se añade al final si hay espacio. */
  function addSuggested(item: ItemDraft) {
    setItems((current) => {
      const empty = current.findIndex((entry) => !entry.label.trim());
      if (empty >= 0) return current.map((entry, index) => (index === empty ? { ...entry, ...item, id: entry.id } : entry));
      return current.length < MAX_ITEMS ? [...current, newEntry(item)] : current;
    });
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function updateItem(key: string, changes: Partial<ItemDraft>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));
  }

  /** Devuelve true si se guardó. */
  async function submit(): Promise<boolean> {
    if (submitting) return false;
    setAttempted(true);
    setSubmitError(null);

    setSubmitting(true);
    const result = await save(draft);
    setSubmitting(false);

    if (result.status === 'saved') onSaved();
    else if (result.status === 'failed') setSubmitError(result.error);
    // 'invalid': los errores ya se ven porque attempted = true.
    return result.status === 'saved';
  }

  const hasRoom = canAddItem || items.some((entry) => !entry.label.trim());

  return { name, setName, items, addItem, addSuggested, hasRoom, removeItem, updateItem, canAddItem, errors, submitting, submitError, submit, dirty };
}
