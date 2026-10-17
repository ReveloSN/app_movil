import { createLocalStore } from './local.store';
import { migratePendingRecords } from './pendingSync.migration';
import { record } from './testing/outbox.fixtures';
import { fixedDeps, memoryStorage } from './testing/memoryStorage';

const OLD_KEY = 'pending-verification-records';

function setup(oldQueue: string) {
  const storage = memoryStorage({ [OLD_KEY]: oldQueue });
  const storeFor = (userId: string) => createLocalStore(userId, storage);
  return { storage, storeFor, run: () => migratePendingRecords(storage, storeFor, fixedDeps()) };
}

const entry = (userId: string, id: string, routineId = 'r1') => ({
  userId,
  record: record(id, routineId),
  queuedAt: '2026-10-13T09:00:00.000Z',
});

const recordIds = async (storeFor: (userId: string) => ReturnType<typeof createLocalStore>, userId: string) =>
  (await storeFor(userId).read()).outbox.flatMap((pending) => (pending.kind === 'insertRecord' ? [pending.record.id] : []));

describe('migratePendingRecords', () => {
  it('pasa cada verificación pendiente a la cola de su dueño, en orden, y borra la cola vieja', async () => {
    const { storage, storeFor, run } = setup(
      JSON.stringify([entry('user-1', 'rec-1'), entry('user-2', 'rec-2'), entry('user-1', 'rec-3')]),
    );

    await run();

    expect(await recordIds(storeFor, 'user-1')).toEqual(['rec-1', 'rec-3']);
    expect(await recordIds(storeFor, 'user-2')).toEqual(['rec-2']);
    expect(storage.data[OLD_KEY]).toBeUndefined();
  });

  it('se puede correr más de una vez sin duplicar', async () => {
    const { storage, storeFor, run } = setup(JSON.stringify([entry('user-1', 'rec-1')]));
    await run();
    storage.data[OLD_KEY] = JSON.stringify([entry('user-1', 'rec-1')]); // ej. otra copia escrita a la vez

    await run();

    expect(await recordIds(storeFor, 'user-1')).toEqual(['rec-1']);
  });

  it('ignora entradas incompletas y una cola corrupta no rompe nada', async () => {
    const incomplete = setup(JSON.stringify([{ userId: 'user-1' }, entry('user-1', 'rec-1')]));
    await incomplete.run();
    expect(await recordIds(incomplete.storeFor, 'user-1')).toEqual(['rec-1']);

    const corrupt = setup('{roto');
    await expect(corrupt.run()).resolves.toBeUndefined();
    expect(corrupt.storage.data[OLD_KEY]).toBeUndefined();
  });

  it('sin cola vieja no hace nada', async () => {
    const storage = memoryStorage();

    await migratePendingRecords(storage, (userId) => createLocalStore(userId, storage), fixedDeps());

    expect(storage.data).toEqual({});
  });
});
