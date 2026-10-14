import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { AuthUser } from './auth.types';
import { clearLastUser, loadLastUser, saveLastUser } from './lastUser.store';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: async (key) => data[key] ?? null,
    setItem: async (key, value) => {
      data[key] = value;
    },
    removeItem: async (key) => {
      delete data[key];
    },
  };
}

const GUEST: AuthUser = { id: 'guest-1', email: null, isAnonymous: true };

describe('lastUser.store', () => {
  it('devuelve el usuario guardado', async () => {
    const storage = memoryStorage();

    await saveLastUser(GUEST, storage);

    expect(await loadLastUser(storage)).toEqual(GUEST);
  });

  it('sin nada guardado, no hay usuario', async () => {
    expect(await loadLastUser(memoryStorage())).toBeNull();
  });

  it('ignora un valor corrupto o incompleto', async () => {
    expect(await loadLastUser(memoryStorage({ 'auth-last-user': '{no es json' }))).toBeNull();
    expect(await loadLastUser(memoryStorage({ 'auth-last-user': '{"email":"a@b.c"}' }))).toBeNull();
  });

  it('al borrarlo, ya no hay usuario', async () => {
    const storage = memoryStorage();
    await saveLastUser(GUEST, storage);

    await clearLastUser(storage);

    expect(await loadLastUser(storage)).toBeNull();
  });
});
