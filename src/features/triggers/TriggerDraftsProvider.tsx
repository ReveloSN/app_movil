import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { TriggerDraftEntry } from './trigger.types';

interface TriggerDraftsContextValue {
  draftsByForm: Readonly<Record<string, TriggerDraftEntry[]>>;
  suggestionsByForm: Readonly<Record<string, TriggerDraftEntry>>;
  upsert(formId: string, entry: TriggerDraftEntry): void;
  remove(formId: string, key: string): void;
  suggest(formId: string, entry: TriggerDraftEntry): void;
  clear(formId: string): void;
}

const TriggerDraftsContext = createContext<TriggerDraftsContextValue | null>(null);

const NO_DRAFTS: TriggerDraftEntry[] = [];

const without = <T,>(record: Record<string, T>, key: string): Record<string, T> => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};

/**
 * Avisos en edición, compartidos entre la pantalla que los lista (P04, onboarding) y P06, que son
 * pantallas distintas del stack. Se agrupan por formulario: cada uno tiene su propio `formId`.
 * Una sugerencia precarga P06 (ej. el aviso de una plantilla) pero no cuenta como aviso hasta que
 * P06 la guarda: salir de P06 sin guardar no agrega nada.
 */
export function TriggerDraftsProvider({ children }: { children: ReactNode }) {
  const [draftsByForm, setDraftsByForm] = useState<Record<string, TriggerDraftEntry[]>>({});
  const [suggestionsByForm, setSuggestionsByForm] = useState<Record<string, TriggerDraftEntry>>({});

  const upsert = useCallback((formId: string, entry: TriggerDraftEntry) => {
    setDraftsByForm((current) => {
      const drafts = current[formId] ?? [];
      const exists = drafts.some((draft) => draft.key === entry.key);
      return {
        ...current,
        [formId]: exists ? drafts.map((draft) => (draft.key === entry.key ? entry : draft)) : [...drafts, entry],
      };
    });
  }, []);

  const remove = useCallback((formId: string, key: string) => {
    setDraftsByForm((current) => ({ ...current, [formId]: (current[formId] ?? []).filter((draft) => draft.key !== key) }));
  }, []);

  const suggest = useCallback((formId: string, entry: TriggerDraftEntry) => {
    setSuggestionsByForm((current) => ({ ...current, [formId]: entry }));
  }, []);

  const clear = useCallback((formId: string) => {
    setDraftsByForm((current) => without(current, formId));
    setSuggestionsByForm((current) => without(current, formId));
  }, []);

  const value = useMemo(
    () => ({ draftsByForm, suggestionsByForm, upsert, remove, suggest, clear }),
    [draftsByForm, suggestionsByForm, upsert, remove, suggest, clear],
  );

  return <TriggerDraftsContext.Provider value={value}>{children}</TriggerDraftsContext.Provider>;
}

/** Avisos del formulario `formId` y cómo modificarlos (funciones estables por formulario). */
export function useTriggerDrafts(formId: string) {
  const context = useContext(TriggerDraftsContext);
  if (!context) throw new Error('useTriggerDrafts debe usarse dentro de <TriggerDraftsProvider>.');
  const { draftsByForm, suggestionsByForm, upsert, remove, suggest, clear } = context;

  const drafts = draftsByForm[formId] ?? NO_DRAFTS;
  const suggestion = suggestionsByForm[formId];
  const upsertDraft = useCallback((entry: TriggerDraftEntry) => upsert(formId, entry), [upsert, formId]);
  const removeDraft = useCallback((key: string) => remove(formId, key), [remove, formId]);
  const suggestDraft = useCallback((entry: TriggerDraftEntry) => suggest(formId, entry), [suggest, formId]);
  const clearDrafts = useCallback(() => clear(formId), [clear, formId]);

  /** Borrador guardado con esa clave o, si no hay, la sugerencia con esa clave. */
  const find = useCallback(
    (key: string | undefined) => drafts.find((draft) => draft.key === key) ?? (suggestion?.key === key ? suggestion : undefined),
    [drafts, suggestion],
  );

  return { drafts, suggestion, find, upsert: upsertDraft, remove: removeDraft, suggest: suggestDraft, clear: clearDrafts };
}
