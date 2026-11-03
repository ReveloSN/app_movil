import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import { clearDraft, loadDraftChecked, localDay, saveDraftChecked, toggleDraftItem } from './checklist.draft';

function memoryStorage(): KeyValueStorage {
  const data: Record<string, string> = {};
  return {
    getItem: async (key) => data[key] ?? null,
    setItem: async (key, value) => {
      data[key] = value;
    },
    removeItem: async (key) => {
      delete data[key];
    },
  };
}

const TODAY = '2026-11-03';
const TOMORROW = '2026-11-04';

describe('borrador de la verificación de hoy', () => {
  it('guarda lo marcado y lo devuelve el mismo día', async () => {
    const storage = memoryStorage();
    await saveDraftChecked('u1', 'r1', ['a', 'b'], TODAY, storage);
    expect(await loadDraftChecked('u1', 'r1', TODAY, storage)).toEqual(['a', 'b']);
  });

  it('al día siguiente empieza sin marcas', async () => {
    const storage = memoryStorage();
    await saveDraftChecked('u1', 'r1', ['a'], TODAY, storage);
    expect(await loadDraftChecked('u1', 'r1', TOMORROW, storage)).toEqual([]);
  });

  it('cada rutina y cada usuario tiene su borrador', async () => {
    const storage = memoryStorage();
    await saveDraftChecked('u1', 'r1', ['a'], TODAY, storage);
    await saveDraftChecked('u1', 'r2', ['x'], TODAY, storage);
    expect(await loadDraftChecked('u1', 'r1', TODAY, storage)).toEqual(['a']);
    expect(await loadDraftChecked('u1', 'r2', TODAY, storage)).toEqual(['x']);
    expect(await loadDraftChecked('u2', 'r1', TODAY, storage)).toEqual([]);
  });

  it('alterna un ítem: lo marca y lo desmarca', async () => {
    const storage = memoryStorage();
    expect(await toggleDraftItem('u1', 'r1', 'a', TODAY, storage)).toEqual(['a']);
    expect(await toggleDraftItem('u1', 'r1', 'b', TODAY, storage)).toEqual(['a', 'b']);
    expect(await toggleDraftItem('u1', 'r1', 'a', TODAY, storage)).toEqual(['b']);
  });

  it('limpiar quita solo esa rutina y deja las de hoy de las demás', async () => {
    const storage = memoryStorage();
    await saveDraftChecked('u1', 'r1', ['a'], TODAY, storage);
    await saveDraftChecked('u1', 'r2', ['x'], TODAY, storage);
    await clearDraft('u1', 'r1', TODAY, storage);
    expect(await loadDraftChecked('u1', 'r1', TODAY, storage)).toEqual([]);
    expect(await loadDraftChecked('u1', 'r2', TODAY, storage)).toEqual(['x']);
  });

  it('descarta los borradores de días pasados al guardar', async () => {
    const storage = memoryStorage();
    await saveDraftChecked('u1', 'old', ['a'], TODAY, storage);
    await saveDraftChecked('u1', 'r1', ['b'], TOMORROW, storage);
    expect(await loadDraftChecked('u1', 'old', TODAY, storage)).toEqual([]);
  });

  it('un contenido dañado se trata como sin borrador', async () => {
    const storage = memoryStorage();
    await storage.setItem('verify-drafts:u1', '{no es json');
    expect(await loadDraftChecked('u1', 'r1', TODAY, storage)).toEqual([]);
  });
});

describe('localDay', () => {
  it('usa el día del teléfono con ceros a la izquierda', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
