import { createLocalRepositories } from '../local/local.repositories';
import { createLocalStore, type StoreChange } from '../local/local.store';
import { fixedDeps, memoryStorage } from '../local/testing/memoryStorage';
import { createSyncEngine } from './sync.engine';
import { fakeRemote, networkError } from './testing/fakeRemote';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup(server = fakeRemote()) {
  const store = createLocalStore('user-1', memoryStorage());
  const engine = createSyncEngine(store, server.remote);
  return { store, server, engine, repos: createLocalRepositories(store, fixedDeps()) };
}

/** Cada sincronización completa baja las rutinas una vez. */
const pulls = (calls: string[]) => calls.filter((call) => call.startsWith('routines.getAll')).length;

describe('createSyncEngine', () => {
  it('una sincronización a la vez: lo que se pide mientras corre se hace una sola vez más al terminar', async () => {
    const { engine, server } = setup();
    const release = server.holdNext('routines.getAll');

    const first = engine.sync();
    await flush();
    const second = engine.sync();
    const third = engine.sync();
    release();
    await Promise.all([first, second, third]);

    expect(pulls(server.calls)).toBe(2);
  });

  it('sin red al subir, no intenta bajar', async () => {
    const { engine, server, repos } = setup();
    await repos.routines.create({ name: 'Casa' });
    server.failNext('routines.create', networkError());

    const report = await engine.sync();

    expect(report).toMatchObject({ pulled: false, changed: false, push: { offline: true } });
    expect(pulls(server.calls)).toBe(0);
  });

  it('si lo que baja cambia algo, lo guarda y avisa como cambio de la sincronización', async () => {
    const server = fakeRemote({
      routines: [
        {
          id: 'r1',
          userId: 'user-1',
          name: 'Del otro teléfono',
          icon: null,
          color: null,
          active: true,
          lastCompletedAt: null,
          createdAt: '2026-10-01T00:00:00.000Z',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    });
    const { engine, store } = setup(server);
    const changes: StoreChange[] = [];
    store.subscribe((change) => changes.push(change));

    const report = await engine.sync();

    expect(report).toMatchObject({ pulled: true, changed: true });
    expect((await store.read()).tables.routines.map((row) => row.name)).toEqual(['Del otro teléfono']);
    expect(changes).toContainEqual(expect.objectContaining({ source: 'sync', tablesChanged: true }));
  });

  it('si no cambia nada, no avisa cambios en las tablas', async () => {
    const { engine, store } = setup();
    const changes: StoreChange[] = [];
    store.subscribe((change) => changes.push(change));

    const report = await engine.sync();

    expect(report.changed).toBe(false);
    expect(changes.some((change) => change.tablesChanged)).toBe(false);
  });
});
