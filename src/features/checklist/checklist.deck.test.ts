import type { ChecklistItemState } from './checklist.types';
import { carriedBy, currentItem, decide, pendingItems, undoLast } from './checklist.deck';

const item = (id: string): ChecklistItemState => ({ id, label: id, icon: null, critical: false, note: null, checked: false });
const items = [item('a'), item('b'), item('c')];

describe('modo "una por una" (P07)', () => {
  it('muestra primero el primer ítem y sigue el orden de la lista', () => {
    expect(currentItem(items, [])?.id).toBe('a');
    expect(currentItem(items, ['a'])?.id).toBe('b');
    expect(pendingItems(items, ['a', 'c']).map((entry) => entry.id)).toEqual(['b']);
  });

  it('no queda tarjeta cuando se respondió todo', () => {
    expect(currentItem(items, ['a', 'b', 'c'])).toBeNull();
    expect(currentItem([], [])).toBeNull();
  });

  it('derecha es "lo llevo" e izquierda es "no lo llevo"', () => {
    expect(carriedBy('right')).toBe(true);
    expect(carriedBy('left')).toBe(false);
  });

  it('no repite una respuesta ya registrada', () => {
    expect(decide(['a'], 'a')).toEqual(['a']);
    expect(decide(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('deshacer quita la última respuesta y dice cuál era', () => {
    expect(undoLast(['a', 'b'])).toEqual({ decided: ['a'], undoneId: 'b' });
    expect(undoLast([])).toEqual({ decided: [], undoneId: null });
  });
});
