import { oldForgotKey } from '@/db/local/forgot.migration';
import { createLocalRepositories } from '@/db/local/local.repositories';
import { createLocalStore } from '@/db/local/local.store';
import { fixedDeps, memoryStorage } from '@/db/local/testing/memoryStorage';

import { ensureForgotMigrated, resetForgotMigrations } from './forgot.migrate';

const OLD = [{ id: 'f1', routineId: 'r1', recordId: null, label: 'Llaves', date: '2026-10-12T12:00:00.000Z' }];

function setup() {
  const storage = memoryStorage({ [oldForgotKey('u1')]: JSON.stringify(OLD) });
  const store = createLocalStore('u1', storage);
  return { storage, store, repos: createLocalRepositories(store, fixedDeps()) };
}

const insertOps = async (store: ReturnType<typeof createLocalStore>) =>
  (await store.read()).outbox.filter((pending) => pending.kind === 'insertForgot').length;

beforeEach(() => resetForgotMigrations());

describe('ensureForgotMigrated', () => {
  it('migra una vez aunque se pida varias veces a la vez o después', async () => {
    const { storage, store, repos } = setup();
    await repos.routines.create({ id: 'r1', name: 'Salir' });

    await Promise.all([ensureForgotMigrated('u1', store, storage), ensureForgotMigrated('u1', store, storage)]);
    // Aunque la clave vieja reapareciera, en esta sesión no se vuelve a leer; y la migración en sí no duplica.
    storage.data[oldForgotKey('u1')] = JSON.stringify(OLD);
    await ensureForgotMigrated('u1', store, storage);
    resetForgotMigrations();
    await ensureForgotMigrated('u1', store, storage);

    expect(await repos.forgotEvents.getAll()).toEqual(OLD);
    expect(await insertOps(store)).toBe(1);
    expect(storage.data[oldForgotKey('u1')]).toBeUndefined();
  });

  it('sin rutinas en el documento (aún sin bajar) espera y no borra la clave vieja', async () => {
    const { storage, store, repos } = setup();

    await ensureForgotMigrated('u1', store, storage);
    expect(storage.data[oldForgotKey('u1')]).toBeDefined();
    expect(await repos.forgotEvents.getAll()).toEqual([]);

    await repos.routines.create({ id: 'r1', name: 'Salir' });
    await ensureForgotMigrated('u1', store, storage);
    expect(await repos.forgotEvents.getAll()).toEqual(OLD);
  });

  it('si falla no bloquea la lectura y se reintenta la próxima vez', async () => {
    const { storage, store, repos } = setup();
    await repos.routines.create({ id: 'r1', name: 'Salir' });
    const broken = { ...storage, getItem: () => Promise.reject(new Error('disco')) };

    await expect(ensureForgotMigrated('u1', store, broken)).resolves.toBeUndefined();
    await ensureForgotMigrated('u1', store, storage);
    expect(await repos.forgotEvents.getAll()).toEqual(OLD);
  });
});
