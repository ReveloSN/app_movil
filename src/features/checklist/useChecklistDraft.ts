import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { refreshWidget } from '@/features/widget/widget.refresh';

import { clearDraft, loadDraftChecked, localDay, saveDraftChecked } from './checklist.draft';
import type { ChecklistItemState } from './checklist.types';

const warn = (scope: string) => (cause: unknown) => {
  if (__DEV__) console.warn(`[checklist.draft.${scope}]`, cause);
};

/**
 * Une la verificación con el borrador de hoy: al abrir toma lo que ya se marcó (por ejemplo desde el widget),
 * guarda cada cambio y avisa al widget. Al terminar, `discard` quita el borrador.
 */
export function useChecklistDraft(
  routineId: string,
  loading: boolean,
  items: readonly ChecklistItemState[],
  applyChecked: (ids: readonly string[]) => void,
) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Hasta leer el borrador no se guarda nada: no se pisa con una lista todavía sin marcar.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading || !userId || hydrated) return;
    let active = true;
    loadDraftChecked(userId, routineId, localDay(new Date()))
      .then((ids) => {
        if (!active) return;
        if (ids.length > 0) applyChecked(ids);
        setHydrated(true);
      })
      .catch((cause: unknown) => {
        warn('load')(cause);
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [loading, userId, hydrated, routineId, applyChecked]);

  const checkedKey = items
    .filter((item) => item.checked)
    .map((item) => item.id)
    .join(',');

  useEffect(() => {
    if (!hydrated || !userId) return;
    saveDraftChecked(userId, routineId, checkedKey ? checkedKey.split(',') : [], localDay(new Date()))
      .then(refreshWidget)
      .catch(warn('save'));
  }, [hydrated, userId, routineId, checkedKey]);

  const discard = useCallback(async () => {
    if (!userId) return;
    await clearDraft(userId, routineId, localDay(new Date())).catch(warn('clear'));
    refreshWidget();
  }, [userId, routineId]);

  return { discard };
}
