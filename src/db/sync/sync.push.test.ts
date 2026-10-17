import { createRoutineWithItems } from '@/features/routines/routine.service';

import { createLocalRepositories } from '../local/local.repositories';
import { createLocalStore } from '../local/local.store';
import { fixedDeps, memoryStorage } from '../local/testing/memoryStorage';
import { pushOutbox } from './sync.push';
import { conflictError, fakeRemote, networkError, rejectedError } from './testing/fakeRemote';

function setup(server = fakeRemote()) {
  const store = createLocalStore('user-1', memoryStorage());
  const repos = createLocalRepositories(store, fixedDeps());
  const push = () => pushOutbox(store, server.remote);
  return { store, repos, server, push };
}

const tablesCalled = (calls: string[]) => calls.map((call) => call.split(':')[0]);

describe('pushOutbox', () => {
  it('envía en el orden de la cola y la vacía', async () => {
    const { store, repos, server, push } = setup();
    const routine = await repos.routines.create({ name: 'Casa' });
    await repos.items.create({ routineId: routine.id, label: 'Llaves' });

    const report = await push();

    expect(tablesCalled(server.calls)).toEqual(['routines.create', 'items.create']);
    expect((await store.read()).outbox).toEqual([]);
    expect(report).toMatchObject({ sent: 2, offline: false, stale: [], failed: [] });
  });

  it('un 23505 en un insert cuenta como hecho: un intento anterior ya llegó', async () => {
    const { store, repos, server, push } = setup();
    await repos.routines.create({ name: 'Casa' });
    server.failNext('routines.create', conflictError());

    await push();

    expect((await store.read()).outbox).toEqual([]);
  });

  it('sin red se detiene y conserva todo, sin marcar nada como fallido', async () => {
    const { store, repos, server, push } = setup();
    const routine = await repos.routines.create({ name: 'Casa' });
    await repos.items.create({ routineId: routine.id, label: 'Llaves' });
    server.failNext('routines.create', networkError());

    const report = await push();

    const { outbox } = await store.read();
    expect(report.offline).toBe(true);
    expect(server.calls).toHaveLength(1);
    expect(outbox).toHaveLength(2);
    expect(outbox.every((op) => !op.failed && !op.sendingSince)).toBe(true);
  });

  it('un rechazo permanente marca fallida la operación (con código y mensaje), bloquea sus dependientes y sigue con lo independiente', async () => {
    const { store, repos, server, push } = setup();
    const broken = await repos.routines.create({ name: 'Casa' });
    await repos.items.create({ routineId: broken.id, label: 'Llaves' });
    const other = await repos.routines.create({ name: 'Trabajo' });
    server.failNext(`routines.create:${broken.id}`, rejectedError('23514'));

    const report = await push();

    const { outbox } = await store.read();
    expect(server.calls).toEqual([`routines.create:${broken.id}`, `routines.create:${other.id}`]);
    expect(outbox).toHaveLength(2); // la rutina fallida y su ítem, bloqueado (no se envió)
    expect(outbox[0]).toMatchObject({
      id: broken.id,
      failed: { code: '23514', message: expect.stringContaining('rejected (23514)') },
    });
    expect(outbox[1]).toMatchObject({ table: 'items' });
    expect(outbox[1].failed).toBeUndefined();
    expect(report.failed).toHaveLength(1);
  });

  it("un update que pierde contra un cambio más reciente sale de la cola y se informa como conflicto", async () => {
    const { store, repos, server, push } = setup();
    const routine = await repos.routines.create({ name: 'Casa' });
    await push();
    server.tables.routines[0].updatedAt = '2099-01-01T00:00:00.000Z'; // otro dispositivo lo cambió después
    await repos.routines.update(routine.id, { name: 'Casa vieja' });

    const report = await push();

    expect(report.stale).toEqual([expect.objectContaining({ kind: 'update', id: routine.id })]);
    expect((await store.read()).outbox).toEqual([]);
  });

  it('una red que ya existe en el servidor con el mismo SSID: adopta su id y lo usa en los avisos', async () => {
    const server = fakeRemote({ homeNetworks: [{ id: 'remote-n', ssid: 'MiWifi', displayName: 'Casa' }] });
    const { store, repos, push } = setup(server);
    await createRoutineWithItems(repos, {
      name: 'Salir',
      items: [{ label: 'Llaves', kind: 'carry', critical: false }],
      triggers: [{ key: 'k', type: 'wifi_exit', ssid: 'MiWifi', networkName: 'Casa', window: null }],
    });

    await push();

    const { tables, outbox } = await store.read();
    expect(outbox).toEqual([]);
    expect(server.tables.triggers[0].networkId).toBe('remote-n');
    expect(tables.triggers[0].networkId).toBe('remote-n');
    expect(tables.homeNetworks.map((network) => network.id)).toEqual(['remote-n']);
  });

  it('una verificación de una rutina borrada en otro dispositivo queda fallida y visible, no se descarta', async () => {
    const { store, repos, server, push } = setup();
    await repos.records.create({ id: 'rec-1', routineId: 'gone', result: 'completed' });
    server.failNext('records.create', rejectedError('23503', 'records'));

    await push();

    expect((await store.read()).outbox).toEqual([
      expect.objectContaining({ kind: 'insertRecord', failed: expect.objectContaining({ code: '23503' }) }),
    ]);
  });

  it('si los ajustes ya existen en el servidor, el insert se aplica como update ("gana el más reciente")', async () => {
    const server = fakeRemote({ settings: [{ id: 'user-1', sound: true, updatedAt: '2026-01-01T00:00:00.000Z' }] });
    const { store, repos, push } = setup(server);
    await repos.settings.create({ sound: false });

    await push();

    expect(server.tables.settings[0].sound).toBe(false);
    expect((await store.read()).outbox).toEqual([]);
  });

  it('un cambio hecho mientras se envía su insert no se pierde: se envía después', async () => {
    const { store, repos, server, push } = setup();
    const routine = await repos.routines.create({ name: 'Casa' });
    const release = server.holdNext('routines.create');

    const pushing = push();
    await new Promise((resolve) => setTimeout(resolve, 0)); // el insert ya salió y espera respuesta
    await repos.routines.update(routine.id, { name: 'Casa nueva' });
    release();
    await pushing;

    expect(server.tables.routines[0].name).toBe('Casa nueva');
    expect((await store.read()).outbox).toEqual([]);
  });
});
