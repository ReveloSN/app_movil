import { criticalGroupRange, moveItem, reorderItems, sortCriticalFirst } from './item-order';

const list = (...ids: string[]) => ids.map((id, sortOrder) => ({ id, sortOrder }));
const orders = (items: { id: string; sortOrder: number }[]) => items.map(({ id, sortOrder }) => `${id}:${sortOrder}`);

describe('reorderItems', () => {
  const items = list('a', 'b', 'c', 'd');

  it('mover hacia abajo devuelve solo los ítems del tramo, con sortOrder contiguos', () => {
    // a b c d -> b c a d
    expect(orders(reorderItems(items, 0, 2))).toEqual(['b:0', 'c:1', 'a:2']);
  });

  it('mover hacia arriba devuelve solo los ítems del tramo', () => {
    // a b c d -> a d b c
    expect(orders(reorderItems(items, 3, 1))).toEqual(['d:1', 'b:2', 'c:3']);
  });

  it('intercambiar dos vecinos cambia solo a esos dos', () => {
    expect(orders(reorderItems(items, 1, 2))).toEqual(['c:1', 'b:2']);
  });

  it('el mismo índice no cambia nada', () => {
    expect(reorderItems(items, 2, 2)).toEqual([]);
  });

  it('los bordes funcionan: primero al final y último al principio', () => {
    expect(orders(reorderItems(items, 0, 3))).toEqual(['b:0', 'c:1', 'd:2', 'a:3']);
    expect(orders(reorderItems(items, 3, 0))).toEqual(['d:0', 'a:1', 'b:2', 'c:3']);
  });

  it('índices fuera de rango no cambian nada', () => {
    expect(reorderItems(items, -1, 2)).toEqual([]);
    expect(reorderItems(items, 1, 9)).toEqual([]);
  });

  it('no modifica la lista de entrada y conserva el resto de campos', () => {
    const input = [
      { id: 'a', sortOrder: 0, label: 'Llaves' },
      { id: 'b', sortOrder: 1, label: 'Cartera' },
    ];
    const changed = reorderItems(input, 0, 1);
    expect(changed).toEqual([
      { id: 'b', sortOrder: 0, label: 'Cartera' },
      { id: 'a', sortOrder: 1, label: 'Llaves' },
    ]);
    expect(input[0].sortOrder).toBe(0);
  });

  it('con 12 ítems (el máximo) mover uno cambia solo el tramo recorrido', () => {
    const twelve = list(...'abcdefghijkl'.split(''));
    expect(reorderItems(twelve, 11, 9).map((item) => item.id)).toEqual(['l', 'j', 'k']);
  });
});

describe('moveItem', () => {
  it('devuelve una copia con el ítem movido', () => {
    const input = ['a', 'b', 'c'];
    expect(moveItem(input, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('índices inválidos o iguales devuelven la misma lista', () => {
    expect(moveItem(['a', 'b'], 0, 0)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
  });
});

describe('criticalGroupRange', () => {
  const sorted = sortCriticalFirst([
    { id: 'a', critical: false },
    { id: 'b', critical: true },
    { id: 'c', critical: false },
    { id: 'd', critical: true },
  ]);

  it('da el tramo del grupo al que pertenece el ítem', () => {
    expect(criticalGroupRange(sorted, 0)).toEqual([0, 1]);
    expect(criticalGroupRange(sorted, 1)).toEqual([0, 1]);
    expect(criticalGroupRange(sorted, 2)).toEqual([2, 3]);
  });

  it('un mover dentro del grupo se mantiene tras ordenar con los críticos arriba', () => {
    const [first, last] = criticalGroupRange(sorted, 3);
    const moved = moveItem(sorted, 3, first);
    expect(first).toBe(2);
    expect(last).toBe(3);
    expect(sortCriticalFirst(moved).map((item) => item.id)).toEqual(moved.map((item) => item.id));
  });
});
