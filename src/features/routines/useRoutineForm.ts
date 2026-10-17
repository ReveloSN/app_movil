import { useMemo, useRef, useState } from 'react';

import type { TriggerDraftEntry } from '@/features/triggers/trigger.types';

import { DEFAULT_ITEM_KIND } from './item-kinds';
import { sortCriticalFirst } from './item-order';
import { resolveRoutineColor, resolveRoutineIcon } from './routine-appearance';
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
  /** El borrador inicial aún no es de la persona (ej. lo hizo la IA): salir sin guardar pregunta. */
  startDirty?: boolean;
}

const NO_ERRORS: RoutineValidationErrors = {};
const NO_TRIGGERS: readonly TriggerDraftEntry[] = [];

// Contador de módulo: solo genera claves únicas para React, no participa en el render.
let entrySeed = 0;
const newEntry = (item: ItemDraft = { label: '', kind: DEFAULT_ITEM_KIND, critical: false }): ItemFormEntry => ({
  key: `item-${entrySeed++}`,
  ...item,
});

// Una rutina nueva empieza sin ítems (EV-03); cada ítem se crea desde la hoja P05.
const initialEntries = (draft: RoutineDraft | undefined): ItemFormEntry[] => (draft ? draft.items.map(newEntry) : []);

/** Estado local del formulario de rutina. Lo escrito se conserva si el guardado falla. */
export function useRoutineForm({ save, onSaved, initialDraft, triggers = NO_TRIGGERS, startDirty = false }: UseRoutineFormOptions) {
  const [name, setName] = useState(initialDraft?.name ?? '');
  // 04-2: siempre hay ícono y color (los de por defecto si la rutina o la plantilla no traen).
  const [startIcon] = useState<string>(() => resolveRoutineIcon(initialDraft?.icon));
  const [startColor] = useState<string>(() => resolveRoutineColor(initialDraft?.color).key);
  const [icon, setIcon] = useState(startIcon);
  const [color, setColor] = useState(startColor);
  const [startItems] = useState<ItemFormEntry[]>(() => initialEntries(initialDraft));
  const [items, setItems] = useState<ItemFormEntry[]>(startItems);
  // Lo que había al abrir (también los avisos ya sembrados): base para saber si hay cambios (DC-03).
  const [initialFingerprint] = useState(() =>
    draftFingerprint(
      toRoutineDraft({ name: initialDraft?.name ?? '', icon: startIcon, color: startColor, items: startItems, triggers }),
    ),
  );
  // Los errores se muestran tras el primer intento de guardar y luego se actualizan en vivo.
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Bloquea el doble toque al instante (el estado llega un render tarde).
  const inFlight = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const draft = useMemo<RoutineDraft>(
    () => toRoutineDraft({ name, icon, color, items, triggers }),
    [name, icon, color, items, triggers],
  );
  const dirty = useMemo(
    () => startDirty || draftFingerprint(draft) !== initialFingerprint,
    [startDirty, draft, initialFingerprint],
  );
  const errors = useMemo(() => (attempted ? validateRoutineDraft(draft) : NO_ERRORS), [attempted, draft]);

  const canAddItem = items.length < MAX_ITEMS;
  // En pantalla, los críticos arriba: el mismo orden con el que se guardan.
  const sortedItems = useMemo(() => sortCriticalFirst(items), [items]);

  /** Ítem en blanco para abrir P05 en modo "nuevo" (aún no está en la lista). */
  const blankItem = () => newEntry();

  /** Guarda lo editado en P05: reemplaza el ítem con esa clave o, si es nuevo y hay espacio, lo añade. */
  function saveItem(entry: ItemFormEntry) {
    setItems((current) => {
      if (current.some((item) => item.key === entry.key)) {
        return current.map((item) => (item.key === entry.key ? entry : item));
      }
      return current.length < MAX_ITEMS ? [...current, entry] : current;
    });
  }

  /** Sugerencia (04-4): se añade al final si hay espacio. */
  function addSuggested(item: ItemDraft) {
    setItems((current) => (current.length < MAX_ITEMS ? [...current, newEntry(item)] : current));
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  /** Devuelve el resultado (null si ya había un guardado en curso). */
  async function submit(): Promise<SaveRoutineResult | null> {
    if (inFlight.current) return null;
    inFlight.current = true;
    setAttempted(true);
    setSubmitError(null);

    setSubmitting(true);
    const result = await save(draft);
    setSubmitting(false);
    inFlight.current = false;

    if (result.status === 'saved') onSaved();
    else if (result.status === 'failed') setSubmitError(result.error);
    // 'invalid': los errores ya se ven porque attempted = true.
    return result;
  }

  return {
    name,
    setName,
    icon,
    setIcon,
    color,
    setColor,
    items: sortedItems,
    blankItem,
    saveItem,
    addSuggested,
    removeItem,
    canAddItem,
    errors,
    submitting,
    submitError,
    submit,
    dirty,
  };
}
