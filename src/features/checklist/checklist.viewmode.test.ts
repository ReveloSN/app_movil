import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import { loadViewModePreference, saveViewModePreference } from './checklist.viewmode';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = { ...initial };
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

describe('forma de verificar guardada en el teléfono', () => {
  it('sin valor guardado se abre la lista', async () => {
    expect(await loadViewModePreference(memoryStorage())).toBe('list');
  });

  it('recuerda "una por una" y vuelve a la lista', async () => {
    const storage = memoryStorage();
    await saveViewModePreference('deck', storage);
    expect(await loadViewModePreference(storage)).toBe('deck');
    await saveViewModePreference('list', storage);
    expect(await loadViewModePreference(storage)).toBe('list');
  });

  it('un valor desconocido o un error de lectura caen a la lista', async () => {
    expect(await loadViewModePreference(memoryStorage({ 'verify-view-mode': 'otro' }))).toBe('list');
    const broken: KeyValueStorage = { ...memoryStorage(), getItem: async () => Promise.reject(new Error('fallo')) };
    expect(await loadViewModePreference(broken)).toBe('list');
  });
});
