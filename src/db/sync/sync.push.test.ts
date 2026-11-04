import { createRoutineWithItems } from '@/features/routines/routine.service';

import { createLocalRepositories } from '../local/local.repositories';
import { createLocalStore } from '../local/local.store';
import { fixedDeps, memoryStorage } from '../local/testing/memoryStorage';
import { pushOutbox } from './sync.push';
import { conflictError, fakeRemote, networkError, rejectedError } from './testing/fakeRemote';
import { forgot } from '../local/testing/outbox.fixtures';

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
    expect(report).toMatchObject({ sent: 2, offline: false, stale: [], failed: [], deferred: [] });
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

  it('el tipo de rutina sigue "gana el más reciente": el cambio más viejo pierde y el nuevo se aplica', async () => {
    const { store, repos, server, push } = setup();
    const routine = await repos.routines.create({ name: 'Casa' });
    await push();
    expect(server.tables.routines[0].kind).toBeUndefined(); // sin kind en el insert: lo pone la base ('departure')

    server.tables.routines[0].updatedAt = '2099-01-01T00:00:00.000Z';
    await repos.routines.update(routine.id, { kind: 'arrival' });
    const stale = await push();
    expect(stale.stale).toEqual([expect.objectContaining({ kind: 'update', changes: { kind: 'arrival' } })]);
    expect(server.tables.routines[0].kind).toBeUndefined();

    server.tables.routines[0].updatedAt = '2000-01-01T00:00:00.000Z';
    await repos.routines.update(routine.id, { kind: 'arrival' });
    await push();
    expect(server.tables.routines[0].kind).toBe('arrival');
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

  describe('servidor sin la migración (sin routines.kind)', () => {
    const oldServer = () => fakeRemote({}, { migrated: false });
    const arrivalDraft = {
      name: 'Llegar',
      kind: 'arrival' as const,
      items: [{ label: 'Llaves', kind: 'carry' as const, critical: false }],
      triggers: [],
    };

    it('una rutina de llegada creada sin red sube sin su tipo y no bloquea sus ítems ni sus olvidos', async () => {
      const server = oldServer();
      const { store, repos, push } = setup(server);
      const routine = await createRoutineWithItems(repos, arrivalDraft);
      await repos.forgotEvents.add({ id: 'f1', routineId: routine.id, label: 'Llaves' });

      const report = await push();

      expect(report.failed).toEqual([]);
      expect(server.tables.routines).toEqual([expect.objectContaining({ id: routine.id, name: 'Llegar' })]);
      expect(server.tables.routines[0]).not.toHaveProperty('kind');
      expect(server.tables.items).toEqual([expect.objectContaining({ routineId: routine.id, label: 'Llaves' })]);
      // Quedan el tipo (como update de solo kind, con la hora de la creación) y el olvido (falta la tabla).
      const { outbox, tables } = await store.read();
      expect(outbox).toEqual([
        expect.objectContaining({ kind: 'update', table: 'routines', id: routine.id, changes: { kind: 'arrival' }, at: routine.updatedAt }),
        expect.objectContaining({ kind: 'insertForgot' }),
      ]);
      expect(outbox.every((op) => !op.failed && !op.sendingSince)).toBe(true);
      expect(tables.routines[0].kind).toBe('arrival');

      // Sin migrar, la siguiente pasada no cambia nada ni marca fallos.
      await push();
      expect((await store.read()).outbox).toHaveLength(2);
      expect((await store.read()).outbox.every((op) => !op.failed)).toBe(true);

      server.migrate();
      await push();
      expect(server.tables.routines[0].kind).toBe('arrival');
      expect(server.tables.forgotEvents).toEqual([expect.objectContaining({ id: 'f1' })]);
      expect((await store.read()).outbox).toEqual([]);
    });

    it('una rutina de salida sube sin tipo y no deja nada pendiente (la base la deja de salida)', async () => {
      const server = oldServer();
      const { store, repos, push } = setup(server);
      await createRoutineWithItems(repos, { ...arrivalDraft, kind: 'departure' });

      await push();

      expect(server.tables.routines).toHaveLength(1);
      expect((await store.read()).outbox).toEqual([]);
    });

    it('un cambio de tipo queda pendiente (no fallido) y viaja con el siguiente cambio de la rutina', async () => {
      const server = oldServer();
      const { store, repos, push } = setup(server);
      const routine = await repos.routines.create({ name: 'Casa' });
      await push();
      await repos.routines.update(routine.id, { kind: 'arrival' });

      const report = await push();
      expect(report).toMatchObject({ failed: [], deferred: [expect.objectContaining({ kind: 'update' })] });
      expect((await store.read()).outbox).toEqual([expect.objectContaining({ changes: { kind: 'arrival' } })]);

      const renamed = await repos.routines.update(routine.id, { name: 'Casa nueva' });
      await push();
      expect(server.tables.routines[0]).toMatchObject({ name: 'Casa nueva', updatedAt: renamed.updatedAt });
      expect((await store.read()).outbox).toEqual([
        expect.objectContaining({ changes: { kind: 'arrival' }, at: renamed.updatedAt }),
      ]);

      server.migrate();
      await push();
      expect(server.tables.routines[0]).toMatchObject({ name: 'Casa nueva', kind: 'arrival' });
      expect((await store.read()).outbox).toEqual([]);
    });

    it('si un cambio posterior quedó aparte en la cola, el tipo se suma a ese y no pierde por ser más viejo', async () => {
      const server = oldServer();
      const { store, repos, push } = setup(server);
      const routine = await repos.routines.create({ name: 'Llegar', kind: 'arrival' });
      const release = server.holdNext('routines.create');

      const pushing = push();
      await new Promise((resolve) => setTimeout(resolve, 0)); // el insert ya salió: el cambio queda aparte
      const renamed = await repos.routines.update(routine.id, { name: 'Llegar a casa' });
      release();
      await pushing;

      expect(server.tables.routines[0].name).toBe('Llegar a casa');
      expect((await store.read()).outbox).toEqual([
        expect.objectContaining({ kind: 'update', changes: { kind: 'arrival' }, at: renamed.updatedAt }),
      ]);

      server.migrate();
      await push();
      expect(server.tables.routines[0]).toMatchObject({ name: 'Llegar a casa', kind: 'arrival' });
    });
  });

  describe('olvidos', () => {
    it('sube el olvido después de su rutina y lo saca de la cola', async () => {
      const { store, repos, server, push } = setup();
      const routine = await repos.routines.create({ name: 'Casa' });
      await repos.forgotEvents.add({ id: 'f1', routineId: routine.id, label: 'Llaves', date: '2026-10-14T10:00:00.000Z' });

      await push();

      expect(tablesCalled(server.calls)).toEqual(['routines.create', 'forgotEvents.create']);
      expect(server.tables.forgotEvents).toEqual([
        expect.objectContaining({ id: 'f1', routineId: routine.id, recordId: null, label: 'Llaves', date: '2026-10-14T10:00:00.000Z' }),
      ]);
      expect((await store.read()).outbox).toEqual([]);
    });

    it('si el servidor ya lo tenía (un intento anterior llegó), cuenta como hecho y no lo duplica', async () => {
      const server = fakeRemote({ forgotEvents: [{ ...forgot('f1', 'r1') }] });
      const { store, repos, push } = setup(server);
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves' });

      const report = await push();

      expect(report).toMatchObject({ sent: 1, failed: [], stale: [] });
      expect(server.tables.forgotEvents).toHaveLength(1);
      expect((await store.read()).outbox).toEqual([]);
    });

    it('un 23505 del servidor también cuenta como hecho', async () => {
      const { store, repos, server, push } = setup();
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves' });
      server.failNext('forgotEvents.create', conflictError('forgot_events'));

      await push();

      expect((await store.read()).outbox).toEqual([]);
    });

    it('queda bloqueado si falla el insert de su rutina (no se envía)', async () => {
      const { store, repos, server, push } = setup();
      const routine = await repos.routines.create({ name: 'Casa' });
      await repos.forgotEvents.add({ id: 'f1', routineId: routine.id, label: 'Llaves' });
      server.failNext('routines.create', rejectedError('23514'));

      await push();

      expect(server.calls).toEqual([`routines.create:${routine.id}`]);
      expect((await store.read()).outbox.map((pending) => pending.kind)).toEqual(['insert', 'insertForgot']);
    });

    it('si su verificación no existe en el servidor, se guarda igual sin ese enlace', async () => {
      const { store, repos, server, push } = setup();
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', recordId: 'rec-gone', label: 'Llaves' });
      server.failNext('forgotEvents.create', rejectedError('23503', 'forgot_events'));

      await push();

      expect(server.tables.forgotEvents).toEqual([expect.objectContaining({ id: 'f1', recordId: null })]);
      expect((await store.read()).outbox).toEqual([]);
    });

    it('sin la tabla en el servidor (falta la migración) queda pendiente, no fallido, y no frena lo demás', async () => {
      const { store, repos, server, push } = setup();
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves' });
      const routine = await repos.routines.create({ name: 'Casa' });
      server.failNext('forgotEvents.create', rejectedError('PGRST205', 'forgot_events'));

      const report = await push();

      expect(report).toMatchObject({ offline: false, failed: [], deferred: [expect.objectContaining({ kind: 'insertForgot' })] });
      expect(server.tables.routines.map((row) => row.id)).toEqual([routine.id]);
      const { outbox } = await store.read();
      expect(outbox).toEqual([expect.objectContaining({ kind: 'insertForgot', attempts: 1 })]);
      expect(outbox[0].failed).toBeUndefined();
      expect(outbox[0].sendingSince).toBeUndefined();

      // Ya con la tabla: se sube en la siguiente sincronización.
      await push();
      expect(server.tables.forgotEvents).toEqual([expect.objectContaining({ id: 'f1' })]);
      expect((await store.read()).outbox).toEqual([]);
    });

    it('también con el error de Postgres (42P01)', async () => {
      const { store, repos, server, push } = setup();
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves' });
      server.failNext('forgotEvents.create', rejectedError('42P01', 'forgot_events'));

      await push();

      expect((await store.read()).outbox).toEqual([expect.not.objectContaining({ failed: expect.anything() })]);
    });

    it('lo que una versión anterior marcó fallido por falta de la tabla se vuelve a intentar solo', async () => {
      const { store, repos, server, push } = setup();
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves' });
      const failed = { code: 'PGRST205', message: "[forgot_events.create] Could not find the table 'public.forgot_events'" };
      await store.update((doc) => ({ doc: { ...doc, outbox: doc.outbox.map((op) => ({ ...op, failed })) }, result: null }));

      await push();

      expect(server.tables.forgotEvents).toEqual([expect.objectContaining({ id: 'f1' })]);
      expect((await store.read()).outbox).toEqual([]);
    });

    it('otra tabla o columna que falta sigue siendo un fallo visible', async () => {
      const { store, repos, server, push } = setup();
      await repos.routines.create({ name: 'Casa' });
      server.failNext('routines.create', rejectedError('PGRST204', 'routines'));

      const report = await push();

      expect(report.failed).toHaveLength(1);
      expect((await store.read()).outbox[0].failed).toMatchObject({ code: 'PGRST204' });
    });

    it('sin red queda en la cola, sin marcarse como fallido', async () => {
      const { store, repos, server, push } = setup();
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves' });
      server.failNext('forgotEvents.create', networkError('forgot_events'));

      const report = await push();

      expect(report.offline).toBe(true);
      expect((await store.read()).outbox).toEqual([expect.objectContaining({ kind: 'insertForgot', attempts: 1 })]);
      expect((await store.read()).outbox[0].failed).toBeUndefined();
    });
  });
});
