import type { ChecklistItemState } from './checklist.types';

/** Ids de los ítems ya respondidos en el modo "una por una", en el orden en que se respondieron. */
export type DeckDecisions = readonly string[];

/** Lado del deslizamiento: derecha = lo llevo, izquierda = no lo llevo. */
export type SwipeDirection = 'left' | 'right';

export const carriedBy = (direction: SwipeDirection) => direction === 'right';

/** Ítems que todavía no se respondieron, en el orden de la lista (los críticos primero). */
export const pendingItems = (items: readonly ChecklistItemState[], decided: DeckDecisions) =>
  items.filter((item) => !decided.includes(item.id));

/** La tarjeta que se muestra ahora; null cuando ya se respondió todo. */
export const currentItem = (items: readonly ChecklistItemState[], decided: DeckDecisions) =>
  pendingItems(items, decided)[0] ?? null;

export const decide = (decided: DeckDecisions, itemId: string): DeckDecisions =>
  decided.includes(itemId) ? decided : [...decided, itemId];

/** Quita la última respuesta; devuelve el id deshecho para devolver su ítem a "sin marcar". */
export function undoLast(decided: DeckDecisions): { decided: DeckDecisions; undoneId: string | null } {
  if (decided.length === 0) return { decided, undoneId: null };
  return { decided: decided.slice(0, -1), undoneId: decided[decided.length - 1] };
}
