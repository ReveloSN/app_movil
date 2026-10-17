import { createLocalStore } from './local.store';
import { op } from './testing/outbox.fixtures';
import { memoryStorage } from './testing/memoryStorage';

describe('createLocalStore', () => {
  it('un usuario sin datos empieza con un documento vacío', async () => {
    const doc = await createLocalStore('user-1', memoryStorage()).read();

    expect(doc).toEqual({
      version: 1,
      tables: { routines: [], items: [], triggers: [], homeNetworks: [], settings: [] },
      outbox: [],
      lastPulledAt: null,
    });
  });

  it('lo guardado sobrevive a cerrar la app (otra instancia lo lee)', async () => {
    const storage = memoryStorage();
    const pending = op({ kind: 'deleteRoutine', id: 'r1' });
    await createLocalStore('user-1', storage).update((doc) => ({ doc: { ...doc, outbox: [pending] }, result: null }));

    expect((await createLocalStore('user-1', storage).read()).outbox).toEqual([pending]);
  });

  it('las escrituras van en serie: ninguna pisa a otra', async () => {
    const store = createLocalStore('user-1', memoryStorage());

    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        store.update((doc) => ({ doc: { ...doc, outbox: [...doc.outbox, op({ kind: 'deleteRoutine', id: `r${index}` })] }, result: null })),
      ),
    );

    expect((await store.read()).outbox).toHaveLength(20);
  });

  it('avisa a los suscriptores después de cada cambio guardado', async () => {
    const store = createLocalStore('user-1', memoryStorage());
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    await store.update((doc) => ({ doc: { ...doc, lastPulledAt: 'x' }, result: null }));
    unsubscribe();
    await store.update((doc) => ({ doc: { ...doc, lastPulledAt: 'y' }, result: null }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('cada usuario tiene su propio documento', async () => {
    const storage = memoryStorage();
    await createLocalStore('user-1', storage).update((doc) => ({ doc: { ...doc, lastPulledAt: 'x' }, result: null }));

    expect((await createLocalStore('user-2', storage).read()).lastPulledAt).toBeNull();
  });

  it('clear borra la copia local del usuario (y solo la suya)', async () => {
    const storage = memoryStorage();
    const guest = createLocalStore('guest-1', storage);
    await guest.update((doc) => ({ doc: { ...doc, lastPulledAt: 'x' }, result: null }));
    await createLocalStore('user-2', storage).update((doc) => ({ doc: { ...doc, lastPulledAt: 'y' }, result: null }));

    await guest.clear();

    expect(storage.data['local-db:guest-1']).toBeUndefined();
    expect((await guest.read()).lastPulledAt).toBeNull();
    expect((await createLocalStore('user-2', storage).read()).lastPulledAt).toBe('y');
  });

  it('un documento corrupto se trata como vacío en vez de romper la app', async () => {
    const storage = memoryStorage({ 'local-db:user-1': '{roto' });

    await expect(createLocalStore('user-1', storage).read()).resolves.toMatchObject({ outbox: [] });
  });
});
