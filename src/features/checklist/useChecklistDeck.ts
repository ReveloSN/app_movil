import { useCallback, useMemo, useState } from 'react';

import { carriedBy, currentItem, decide, undoLast, type DeckDecisions, type SwipeDirection } from './checklist.deck';
import type { ChecklistItemState } from './checklist.types';

/**
 * Estado del modo "una por una": qué tarjeta toca y qué ya se respondió. Responder marca o deja sin marcar
 * el ítem en la misma lista de la verificación, así que cambiar de modo no pierde nada.
 */
export function useChecklistDeck(
  items: readonly ChecklistItemState[],
  setItemChecked: (itemId: string, checked: boolean) => void,
) {
  const [decided, setDecided] = useState<DeckDecisions>([]);
  const current = useMemo(() => currentItem(items, decided), [items, decided]);

  const answer = useCallback(
    (direction: SwipeDirection) => {
      if (!current) return;
      setItemChecked(current.id, carriedBy(direction));
      setDecided((previous) => decide(previous, current.id));
    },
    [current, setItemChecked],
  );

  const undo = useCallback(() => {
    const { decided: rest, undoneId } = undoLast(decided);
    if (undoneId === null) return;
    setItemChecked(undoneId, false);
    setDecided(rest);
  }, [decided, setItemChecked]);

  return { current, answer, undo, canUndo: decided.length > 0 };
}
