import { createLocalRepositories } from './local.repositories';
import { createLocalStore } from './local.store';
import { migrateForgotEvents, oldForgotKey } from './forgot.migration';
import { forgot } from './testing/outbox.fixtures';
import { fixedDeps, memoryStorage } from './testing/memoryStorage';

const OLD_KEY = oldForgotKey('user-1');

async function setup(old: string | null, routineIds: string[] = ['r1']) {
  const storage = memoryStorage(old === null ? {} : { [OLD_KEY]: old });
  const storeFor = (userId: string) => createLocalStore(userId, storage);
  const repos = createLocalRepositories(storeFor('user-1'), fixedDeps());
  for (const id of routineIds) await repos.routines.create({ id, name: `Rutina ${id}` });
  // Rutinas ya subidas: la cola empieza vacía.
  await storeFor('user-1').update((doc) => ({ doc: { ...doc, outbox: [] }, result: null }));
  const deps = fixedDeps();
  return { storage, storeFor, run: () => migrateForgotEvents('user-1', storage, storeFor, deps) };
}

const forgotOps = async (storeFor: (userId: string) => ReturnType<typeof createLocalStore>) =>
  (await storeFor('user-1').read()).outbox.flatMap((pending) => (pending.kind === 'insertForgot' ? [pending.event.id] : []));

describe('migrateForgotEvents', () => {
  it('pasa los olvidos del teléfono al documento y a la cola (del más viejo al más nuevo) y borra la clave vieja', async () => {
    const newer = forgot('f2', 'r1', { date: '2026-10-15T08:00:00.000Z', recordId: 'rec-1' });
    const older = forgot('f1', 'r1', { date: '2026-10-14T08:00:00.000Z' });
    const { storage, storeFor, run } = await setup(JSON.stringify([newer, older]));

    await run();

    const doc = await storeFor('user-1').read();
    expect(doc.forgotEvents).toEqual([newer, older]);
    expect(await forgotOps(storeFor)).toEqual(['f1', 'f2']);
    expect(doc.outbox[0]).toMatchObject({ kind: 'insertForgot', at: older.date, attempts: 0 });
    expect(storage.data[OLD_KEY]).toBeUndefined();
  });

  it('descarta los olvidos de rutinas que ya no existen', async () => {
    const { storeFor, run } = await setup(JSON.stringify([forgot('f1', 'r1'), forgot('f2', 'gone')]));

    await run();

    expect((await storeFor('user-1').read()).forgotEvents?.map((event) => event.id)).toEqual(['f1']);
    expect(await forgotOps(storeFor)).toEqual(['f1']);
  });

  it('se puede correr más de una vez sin duplicar, aunque el primero ya se haya subido', async () => {
    const old = JSON.stringify([forgot('f1', 'r1')]);
    const { storage, storeFor, run } = await setup(old);
    await run();
    await storeFor('user-1').update((doc) => ({ doc: { ...doc, outbox: [] }, result: null })); // ya subido
    storage.data[OLD_KEY] = old; // ej. otra copia escrita a la vez

    await run();

    expect((await storeFor('user-1').read()).forgotEvents).toHaveLength(1);
    expect(await forgotOps(storeFor)).toEqual([]);
    expect(storage.data[OLD_KEY]).toBeUndefined();
  });

  it('ignora entradas incompletas y una clave corrupta no rompe nada (se borra)', async () => {
    const incomplete = await setup(JSON.stringify([{ id: 'x' }, forgot('f1', 'r1', { label: '' }), forgot('f2', 'r1')]));
    await incomplete.run();
    expect(await forgotOps(incomplete.storeFor)).toEqual(['f2']);

    const corrupt = await setup('{roto');
    await expect(corrupt.run()).resolves.toBeUndefined();
    expect(corrupt.storage.data[OLD_KEY]).toBeUndefined();
  });

  it('si alguien escribe en la clave vieja mientras migra, no la borra (lo nuevo se pasa la próxima vez)', async () => {
    const { storage, storeFor } = await setup(JSON.stringify([forgot('f1', 'r1')]));
    const racing = {
      ...storage,
      getItem: async (key: string) => {
        const value = await storage.getItem(key);
        if (key === OLD_KEY) storage.data[OLD_KEY] = JSON.stringify([forgot('f1', 'r1'), forgot('f2', 'r1')]);
        return value;
      },
    };

    await migrateForgotEvents('user-1', racing, storeFor, fixedDeps());
    expect(storage.data[OLD_KEY]).toBeDefined();

    await migrateForgotEvents('user-1', storage, storeFor, fixedDeps());
    expect(await forgotOps(storeFor)).toEqual(['f1', 'f2']);
    expect(storage.data[OLD_KEY]).toBeUndefined();
  });

  it('sin clave vieja no hace nada', async () => {
    const { storage, storeFor, run } = await setup(null);
    const before = { ...storage.data };

    await run();

    expect(storage.data).toEqual(before);
    expect(await forgotOps(storeFor)).toEqual([]);
  });
});
