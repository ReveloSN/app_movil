/** "El ítem crítico sube en la lista": críticos primero, cada grupo en su orden original (estable). */
export const sortCriticalFirst = <T extends { critical: boolean }>(items: readonly T[]): T[] => [
  ...items.filter((item) => item.critical),
  ...items.filter((item) => !item.critical),
];

const isValidIndex = (length: number, index: number) => Number.isInteger(index) && index >= 0 && index < length;

/** Copia de la lista con el elemento de `from` puesto en `to`. Índices fuera de rango: la misma lista. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from === to || !isValidIndex(items.length, from) || !isValidIndex(items.length, to)) return next;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Mueve el ítem de `from` a `to` y devuelve SOLO los ítems cuyo `sortOrder` cambia, ya con el nuevo valor
 * (contiguo: 0, 1, 2…, según la posición). La lista llega en su orden actual. Mismo índice o índices fuera
 * de rango: nada cambia. Sirve para guardar un reordenamiento en un solo lote al soltar.
 */
export function reorderItems<T extends { sortOrder: number }>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || !isValidIndex(items.length, from) || !isValidIndex(items.length, to)) return [];
  return moveItem(items, from, to).flatMap((item, index) => (item.sortOrder === index ? [] : [{ ...item, sortOrder: index }]));
}

/**
 * Rango de posiciones [first, last] que ocupa, en la lista ya ordenada con los críticos arriba, el grupo
 * (críticos o no) del ítem en `index`. Un ítem solo se reordena dentro de su grupo: cruzarlo lo devolvería
 * a su sitio al mostrar la lista.
 */
export function criticalGroupRange(items: readonly { critical: boolean }[], index: number): [number, number] {
  const critical = items[index]?.critical;
  let first = index;
  let last = index;
  while (first > 0 && items[first - 1].critical === critical) first -= 1;
  while (last < items.length - 1 && items[last + 1].critical === critical) last += 1;
  return [first, last];
}
