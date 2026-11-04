import { criticalGroupRange, moveItem, sortCriticalFirst } from './item-order';

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
