import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ItemRepository } from '@/db/repositories/item.repository';
import { useLocalRepositories } from '@/features/local-data/LocalRepositoriesProvider';
import { toChecklistItems } from './checklist.items';
import type { ChecklistItemState, ChecklistProgress } from './checklist.types';

const LOAD_ERROR = 'No pudimos cargar los ítems de esta rutina.';

/**
 * Ítems de una rutina para verificar, desde la copia local: abre igual sin conexión. Marcar/desmarcar es
 * solo estado de la pantalla (instantáneo); el resultado se guarda al terminar (useFinishChecklist).
 */
export function useChecklist(
  routineId: string,
  injected?: Pick<ItemRepository, 'getByRoutine'>,
) {
  const local = useLocalRepositories();
  const itemRepository = injected ?? local.items;
  const [items, setItems] = useState<ChecklistItemState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Epoch ms en que la lista quedó visible: base de durationSeconds. */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const latestRequest = useRef(0);

  // El estado solo se toca en los callbacks de la promesa (nunca de forma síncrona en el efecto).
  const load = useCallback((): Promise<void> => {
    const request = ++latestRequest.current;
    const isLatest = () => request === latestRequest.current;

    return itemRepository.getByRoutine(routineId).then(
      (rows) => {
        if (!isLatest()) return;
        const now = Date.now();
        setItems(toChecklistItems(rows));
        setError(null);
        setLoading(false);
        setStartedAt((current) => current ?? now);
      },
      (cause: unknown) => {
        if (!isLatest()) return;
        if (__DEV__) console.warn('[checklist.load]', cause);
        setError(LOAD_ERROR);
        setLoading(false);
      },
    );
  }, [itemRepository, routineId]);

  useEffect(() => {
    void load();
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    void load();
  }, [load]);

  /** Ítem solo para esta verificación (ej. "Paraguas" por el clima): no cambia la rutina. Si ya está, no se repite. */
  const addTemporaryItem = useCallback((item: Pick<ChecklistItemState, 'id' | 'label' | 'icon' | 'origin'>) => {
    setItems((current) =>
      current.some((existing) => existing.id === item.id) ? current : [...current, { ...item, critical: false, note: null, checked: false }],
    );
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)));
  }, []);

  /** Fija el estado de un ítem (el modo "una por una" responde sí o no, no alterna). */
  const setItemChecked = useCallback((itemId: string, checked: boolean) => {
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, checked } : item)));
  }, []);

  /** Marca los ítems cuyo id está en `ids` (el borrador del día); no desmarca ninguno. */
  const applyChecked = useCallback((ids: readonly string[]) => {
    setItems((current) => current.map((item) => (ids.includes(item.id) ? { ...item, checked: true } : item)));
  }, []);

  const progress = useMemo<ChecklistProgress>(
    () => ({ checked: items.filter((item) => item.checked).length, total: items.length }),
    [items],
  );

  return { items, loading, error, retry, toggleItem, setItemChecked, applyChecked, addTemporaryItem, progress, startedAt };
}
