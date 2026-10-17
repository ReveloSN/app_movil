import type { TriggerDraftEntry } from '@/features/triggers/trigger.types';
import { stableStringify } from '@/shared/utils/stableStringify';

import type { ItemDraft, RoutineDraft } from './routines.types';

/** Lo que el formulario de P04 tiene en pantalla. Los ítems traen su clave de React, que no se guarda. */
export interface RoutineFormState {
  name: string;
  icon?: string;
  color?: string;
  items: readonly (ItemDraft & { key?: string })[];
  triggers: readonly TriggerDraftEntry[];
}

/** Borrador para guardar: los ítems sin su clave de React. */
export const toRoutineDraft = ({ name, icon, color, items, triggers }: RoutineFormState): RoutineDraft => ({
  name,
  icon,
  color,
  items: items.map(({ key: _key, ...item }) => item),
  triggers: [...triggers],
});

/** Huella del borrador: si es igual a la del inicio, no hay cambios que perder (DC-03). */
export const draftFingerprint = (draft: RoutineDraft): string => stableStringify(draft);
