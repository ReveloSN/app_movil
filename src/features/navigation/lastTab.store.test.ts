import { memoryStorage } from '@/db/local/testing/memoryStorage';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import { loadLastTab, saveLastTab, tabPath } from './lastTab.store';

const broken: KeyValueStorage = {
  getItem: () => Promise.reject(new Error('sin almacenamiento')),
  setItem: () => Promise.reject(new Error('sin almacenamiento')),
  removeItem: () => Promise.reject(new Error('sin almacenamiento')),
};

describe('última pestaña usada', () => {
  it('guarda y lee una pestaña válida', async () => {
    const storage = memoryStorage();
    await saveLastTab('history', storage);
    expect(await loadLastTab(storage)).toBe('history');
  });

  it('ignora nombres que no son pestañas', async () => {
    const storage = memoryStorage();
    await saveLastTab('routine/new', storage);
    expect(await loadLastTab(storage)).toBeNull();
  });

  it('si el almacenamiento falla, no rompe nada: abre Inicio', async () => {
    await expect(saveLastTab('settings', broken)).resolves.toBeUndefined();
    expect(await loadLastTab(broken)).toBeNull();
  });

  it('ruta de cada pestaña', () => {
    expect(tabPath('index')).toBe('/');
    expect(tabPath('settings')).toBe('/settings');
  });
});
