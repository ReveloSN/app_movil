import { resolveItemIcon } from './item-icons';
import { sortCriticalFirst } from './item-order';
import { validateItemDraft } from './routine.validation';

describe('editar ítem (P05)', () => {
  it('la etiqueta es obligatoria y de máximo 32 caracteres', () => {
    expect(validateItemDraft({ label: '  ', note: '' }).label).toBe('Escribe el ítem.');
    expect(validateItemDraft({ label: 'x'.repeat(33), note: '' }).label).toBe('Máximo 32 caracteres.');
    expect(validateItemDraft({ label: 'Llaves', note: '' })).toEqual({});
  });

  it('la nota es opcional y de máximo 60 caracteres', () => {
    expect(validateItemDraft({ label: 'Llaves', note: 'x'.repeat(61) }).note).toBe('Máximo 60 caracteres.');
    expect(validateItemDraft({ label: 'Llaves', note: 'x'.repeat(60) })).toEqual({});
  });

  it('un ícono desconocido cae al genérico, con su texto alternativo', () => {
    expect(resolveItemIcon('rocket')).toEqual({ icon: 'cube-outline', label: 'Objeto' });
    expect(resolveItemIcon('key-outline').label).toBe('Llaves');
  });
});

describe('orden de ítems', () => {
  it('los críticos suben, y cada grupo conserva su orden', () => {
    const items = [
      { label: 'a', critical: false },
      { label: 'b', critical: true },
      { label: 'c', critical: false },
      { label: 'd', critical: true },
    ];
    expect(sortCriticalFirst(items).map((item) => item.label)).toEqual(['b', 'd', 'a', 'c']);
  });
});
