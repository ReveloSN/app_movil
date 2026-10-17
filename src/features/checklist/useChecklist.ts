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

  const toggleItem = useCallback((itemId: string) => {
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)));
  }, []);

  const progress = useMemo<ChecklistProgress>(
    () => ({ checked: items.filter((item) => item.checked).length, total: items.length }),
    [items],
  );

  return { items, loading, error, retry, toggleItem, progress, startedAt };
}
