import { resetLocaleForTests, setLocale } from './locale.store';
import { localized } from './localized';
import { memoryStorage } from '@/db/local/testing/memoryStorage';

const copy = localized(
  {
    TITLE: 'Próxima rutina',
    LABELS: ['Hoy', 'Mañana'],
    nested: { SAVE: 'Guardar' },
    editLabel: (name: string) => `Editar ${name}`,
    count: (n: number) => (n === 1 ? '1 cosa' : `${n} cosas`),
  },
  {
    TITLE: 'Next routine',
    LABELS: ['Today', 'Tomorrow'],
    nested: { SAVE: 'Save' },
    editLabel: (name: string) => `Edit ${name}`,
    count: (n: number) => (n === 1 ? '1 thing' : `${n} things`),
  },
);

describe('localized', () => {
  beforeEach(resetLocaleForTests);

  it('devuelve el español por defecto', () => {
    expect(copy.TITLE).toBe('Próxima rutina');
    expect(copy.editLabel('Gym')).toBe('Editar Gym');
  });

  it('cambia al inglés al leer, sin volver a crear el objeto', async () => {
    const before = copy;
    await setLocale('en', memoryStorage());
    expect(copy).toBe(before);
    expect(copy.TITLE).toBe('Next routine');
    expect(copy.LABELS).toEqual(['Today', 'Tomorrow']);
    expect(copy.nested.SAVE).toBe('Save');
    expect(copy.count(1)).toBe('1 thing');
    expect(copy.count(3)).toBe('3 things');
  });

  it('vuelve al español', async () => {
    const storage = memoryStorage();
    await setLocale('en', storage);
    await setLocale('es', storage);
    expect(copy.TITLE).toBe('Próxima rutina');
  });

  it('se puede recorrer como un objeto normal', () => {
    expect(Object.keys(copy)).toEqual(['TITLE', 'LABELS', 'nested', 'editLabel', 'count']);
    expect('TITLE' in copy).toBe(true);
  });
});
