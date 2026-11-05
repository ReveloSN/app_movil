import { UnsupportedDocumentVersionError } from './local-document.migration';
import { createLocalStore } from './local.store';
import { op } from './testing/outbox.fixtures';
import { memoryStorage } from './testing/memoryStorage';

describe('createLocalStore', () => {
  it('un usuario sin datos empieza con un documento vacío', async () => {
    const doc = await createLocalStore('user-1', memoryStorage()).read();

    expect(doc).toEqual({
      version: 2,
      tables: { routines: [], items: [], triggers: [], homeNetworks: [], settings: [] },
      outbox: [],
      lastPulledAt: null,
      forgotEvents: [],
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

  describe('versiones del documento', () => {
    const v1Routine = {
      id: 'r1',
      userId: 'user-1',
      name: 'Salir de casa',
      icon: null,
      color: null,
      active: true,
      lastCompletedAt: null,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    const v1Item = { id: 'i1', routineId: 'r1', label: 'Llaves', icon: null, type: 'carry', critical: true, note: null, sortOrder: 0, updatedAt: '2026-10-01T00:00:00.000Z' };
    const v1Record = { id: 'rec-1', routineId: 'r1', date: '2026-10-02T08:00:00.000Z', result: 'completed', itemsChecked: null, durationSeconds: 12 };
    const v1Op = op({ kind: 'update', table: 'routines', id: 'r1', changes: { name: 'Salir de casa' } });
    const v1 = {
      version: 1,
      tables: { routines: [v1Routine], items: [v1Item], triggers: [], homeNetworks: [], settings: [] },
      outbox: [v1Op],
      lastPulledAt: '2026-10-02T09:00:00.000Z',
      records: [v1Record],
    };

    it('un documento v1 se lee como v2 sin perder nada: rutinas de salida y sin olvidos', async () => {
      const storage = memoryStorage({ 'local-db:user-1': JSON.stringify(v1) });

      const doc = await createLocalStore('user-1', storage).read();

      expect(doc).toEqual({
        ...v1,
        version: 2,
        tables: { ...v1.tables, routines: [{ ...v1Routine, kind: 'departure' }] },
        forgotEvents: [],
      });
    });

    it('la primera escritura sobre un v1 guarda el documento migrado, con todo lo anterior', async () => {
      const storage = memoryStorage({ 'local-db:user-1': JSON.stringify(v1) });
      const store = createLocalStore('user-1', storage);

      await store.update((doc) => ({ doc: { ...doc, lastPulledAt: 'x' }, result: null }));

      const saved = JSON.parse(storage.data['local-db:user-1']);
      expect(saved).toMatchObject({ version: 2, outbox: [v1Op], records: [v1Record], forgotEvents: [] });
      expect(saved.tables.items).toEqual([v1Item]);
      expect(saved.tables.routines[0]).toMatchObject({ id: 'r1', kind: 'departure' });
    });

    it('un v2 se lee tal cual (no pisa el tipo de rutina)', async () => {
      const v2 = { ...v1, version: 2, tables: { ...v1.tables, routines: [{ ...v1Routine, kind: 'arrival' }] }, forgotEvents: [] };
      const storage = memoryStorage({ 'local-db:user-1': JSON.stringify(v2) });

      expect(await createLocalStore('user-1', storage).read()).toEqual(v2);
    });

    it('un documento de una versión futura no se vacía ni se reescribe: falla al leer y al escribir', async () => {
      const future = JSON.stringify({ ...v1, version: 3 });
      const storage = memoryStorage({ 'local-db:user-1': future });
      const store = createLocalStore('user-1', storage);
      const listener = jest.fn();
      store.subscribe(listener);

      await expect(store.read()).rejects.toBeInstanceOf(UnsupportedDocumentVersionError);
      await expect(store.update((doc) => ({ doc: { ...doc, lastPulledAt: 'x' }, result: null }))).rejects.toMatchObject({
        version: 3,
      });

      expect(storage.data['local-db:user-1']).toBe(future);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('caché de lectura', () => {
    it('leer dos veces sin cambios reutiliza el mismo documento', async () => {
      const store = createLocalStore('user-1', memoryStorage());
      await store.update((doc) => ({ doc: { ...doc, outbox: [op({ kind: 'deleteRoutine', id: 'r1' })] }, result: null }));

      expect(await store.read()).toBe(await store.read());
    });

    it('una escritura de otra instancia (la tarea en segundo plano) se ve en la siguiente lectura', async () => {
      const storage = memoryStorage();
      const app = createLocalStore('user-1', storage);
      await app.read();
      const pending = op({ kind: 'deleteRoutine', id: 'r9' });
      await createLocalStore('user-1', storage).update((doc) => ({ doc: { ...doc, outbox: [pending] }, result: null }));

      expect((await app.read()).outbox).toEqual([pending]);
    });

    it('tras borrar la copia local no queda nada en la caché', async () => {
      const store = createLocalStore('user-1', memoryStorage());
      await store.update((doc) => ({ doc: { ...doc, outbox: [op({ kind: 'deleteRoutine', id: 'r1' })] }, result: null }));
      await store.clear();

      expect((await store.read()).outbox).toEqual([]);
    });
  });
});
