import { createRoutineWithItems } from '@/features/routines/routine.service';

import { RepositoryError } from '../repositories/repository.types';
import { createLocalRepositories } from './local.repositories';
import { createLocalStore } from './local.store';
import { fixedDeps, memoryStorage } from './testing/memoryStorage';

function setup() {
  const store = createLocalStore('user-1', memoryStorage());
  return { store, repos: createLocalRepositories(store, fixedDeps()) };
}

describe('repositorios local-first', () => {
  it('crear una rutina la guarda en el teléfono con id y hora del cliente, y la encola para subir', async () => {
    const { store, repos } = setup();

    const routine = await repos.routines.create({ name: 'Salir de casa', icon: 'home' });

    expect(routine).toMatchObject({
      id: 'id-1',
      userId: 'user-1',
      name: 'Salir de casa',
      kind: 'departure',
      active: true,
      lastCompletedAt: null,
    });
    expect(await repos.routines.getAll()).toEqual([routine]);
    expect((await store.read()).outbox).toEqual([
      expect.objectContaining({
        kind: 'insert',
        table: 'routines',
        id: 'id-1',
        values: { id: 'id-1', name: 'Salir de casa', icon: 'home', updatedAt: routine.updatedAt },
      }),
    ]);
  });

  it('getByRoutine devuelve solo los ítems de esa rutina, ordenados', async () => {
    const { repos } = setup();
    await repos.items.create({ routineId: 'r1', label: 'Gafas', sortOrder: 1 });
    await repos.items.create({ routineId: 'r2', label: 'Otra', sortOrder: 0 });
    await repos.items.create({ routineId: 'r1', label: 'Llaves', sortOrder: 0 });

    expect((await repos.items.getByRoutine('r1')).map((item) => item.label)).toEqual(['Llaves', 'Gafas']);
  });

  it('actualizar cambia la copia local, su hora de cambio, y encola solo lo que cambió', async () => {
    const { store, repos } = setup();
    const item = await repos.items.create({ routineId: 'r1', label: 'Llaves' });
    await store.update((doc) => ({ doc: { ...doc, outbox: [] }, result: null })); // como si ya se hubiera subido

    const updated = await repos.items.update(item.id, { label: 'Llaves de casa' });

    expect(updated).toMatchObject({ label: 'Llaves de casa', critical: false });
    expect(updated.updatedAt > item.updatedAt).toBe(true);
    expect((await store.read()).outbox).toEqual([
      expect.objectContaining({ kind: 'update', table: 'items', id: item.id, changes: { label: 'Llaves de casa' }, at: updated.updatedAt }),
    ]);
  });

  it('actualizar algo que no existe falla como en el servidor', async () => {
    const { repos } = setup();

    await expect(repos.routines.update('nope', { name: 'X' })).rejects.toBeInstanceOf(RepositoryError);
  });

  it('borrar una rutina que ya estaba en el servidor borra en el teléfono sus ítems y avisos, y encola deleteRoutine', async () => {
    const { store, repos } = setup();
    const routine = await repos.routines.create({ name: 'Casa' });
    await repos.items.create({ routineId: routine.id, label: 'Llaves' });
    await repos.triggers.create({ routineId: routine.id, type: 'schedule', time: '07:00:00', days: [1] });
    await store.update((doc) => ({ doc: { ...doc, outbox: [] }, result: null })); // ya subidos

    await repos.routines.delete(routine.id);

    const doc = await store.read();
    expect(doc.tables).toMatchObject({ routines: [], items: [], triggers: [] });
    expect(doc.outbox).toEqual([expect.objectContaining({ kind: 'deleteRoutine', id: routine.id })]);
  });

  it('una verificación queda en el historial local (sin red) y se quita al borrar su rutina', async () => {
    const { repos } = setup();
    await repos.records.create({ id: 'rec-1', routineId: 'r1', result: 'completed', date: '2026-10-14T08:00:00.000Z' });
    await repos.records.create({ id: 'rec-2', routineId: 'r2', result: 'partial', date: '2026-10-15T08:00:00.000Z' });

    expect((await repos.records.getAll()).map((record) => record.id)).toEqual(['rec-2', 'rec-1']);
    await repos.records.deleteByRoutine('r1');
    expect((await repos.records.getAll()).map((record) => record.id)).toEqual(['rec-2']);
  });

  it('una verificación va directo a la cola (no se guarda como tabla local)', async () => {
    const { store, repos } = setup();

    const saved = await repos.records.create({ id: 'rec-1', routineId: 'r1', result: 'completed', durationSeconds: 12 });

    expect(saved).toMatchObject({ id: 'rec-1', routineId: 'r1', result: 'completed', itemsChecked: null });
    expect((await store.read()).outbox).toEqual([
      expect.objectContaining({ kind: 'insertRecord', record: expect.objectContaining({ id: 'rec-1', routineId: 'r1' }) }),
    ]);
  });

  it('terminar una verificación completa actualiza "Última vez" de la rutina en el teléfono, sin encolar un cambio de rutina', async () => {
    const { store, repos } = setup();
    const routine = await repos.routines.create({ name: 'Casa' });
    await store.update((doc) => ({ doc: { ...doc, outbox: [] }, result: null }));

    await repos.records.create({ id: 'rec-1', routineId: routine.id, result: 'completed', date: '2026-10-14T18:30:00.000Z' });
    await repos.records.create({ id: 'rec-2', routineId: routine.id, result: 'partial', date: '2026-10-14T19:00:00.000Z' });

    const doc = await store.read();
    expect(doc.tables.routines[0].lastCompletedAt).toBe('2026-10-14T18:30:00.000Z'); // la parcial no cuenta
    expect(doc.outbox.map((pending) => pending.kind)).toEqual(['insertRecord', 'insertRecord']);
  });

  it('los ajustes se crean con los valores por defecto de la tabla y se identifican por el usuario', async () => {
    const { repos } = setup();

    const settings = await repos.settings.create({});
    const updated = await repos.settings.update('user-1', { sound: false });

    expect(settings).toMatchObject({ userId: 'user-1', doNotDisturb: false, snoozeMinutes: 5, sound: true });
    expect(updated.sound).toBe(false);
  });

  it('las redes se listan por nombre', async () => {
    const { repos } = setup();
    await repos.homeNetworks.create({ ssid: 'b', displayName: 'Oficina' });
    await repos.homeNetworks.create({ ssid: 'a', displayName: 'Casa' });

    expect((await repos.homeNetworks.getAll()).map((network) => network.displayName)).toEqual(['Casa', 'Oficina']);
  });

  it('el servicio de crear rutina funciona sin red: rutina, ítems, red nueva y aviso de Wi-Fi, en orden', async () => {
    const { store, repos } = setup();

    await createRoutineWithItems(repos, {
      name: 'Salir de casa',
      items: [{ label: 'Llaves', kind: 'carry', critical: true }],
      triggers: [{ key: 'k1', type: 'wifi_exit', ssid: 'MiWifi', networkName: 'Casa', window: null }],
    });

    const { tables, outbox } = await store.read();
    expect(outbox.map((pending) => (pending.kind === 'insert' ? pending.table : pending.kind))).toEqual([
      'routines',
      'items',
      'homeNetworks',
      'triggers',
    ]);
    expect(tables.triggers[0]).toMatchObject({ routineId: tables.routines[0].id, networkId: tables.homeNetworks[0].id });
  });

  describe('olvidos', () => {
    it('anotar un olvido lo guarda en el teléfono y lo encola para subir en el mismo guardado', async () => {
      const { store, repos } = setup();
      const listener = jest.fn();
      store.subscribe(listener);

      const event = await repos.forgotEvents.add({ routineId: 'r1', recordId: 'rec-1', label: '  Llaves  ' });

      expect(event).toEqual({ id: 'id-1', routineId: 'r1', recordId: 'rec-1', label: 'Llaves', date: expect.any(String) });
      const doc = await store.read();
      expect(doc.forgotEvents).toEqual([event]);
      expect(doc.outbox).toEqual([expect.objectContaining({ kind: 'insertForgot', event, at: event.date })]);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ outboxChanged: true, forgotEventsChanged: true }));
    });

    it('agregar dos veces el mismo id no lo duplica (ni en el teléfono ni en la cola)', async () => {
      const { store, repos } = setup();
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves' });
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves' });

      const doc = await store.read();
      expect(doc.forgotEvents).toHaveLength(1);
      expect(doc.outbox).toHaveLength(1);
    });

    it('getAll va del más reciente al más antiguo y getByRoutine filtra por rutina', async () => {
      const { repos } = setup();
      await repos.forgotEvents.add({ id: 'f1', routineId: 'r1', label: 'Llaves', date: '2026-10-14T08:00:00.000Z' });
      await repos.forgotEvents.add({ id: 'f2', routineId: 'r2', label: 'Gafas', date: '2026-10-15T08:00:00.000Z' });
      await repos.forgotEvents.add({ id: 'f3', routineId: 'r1', label: 'Cartera', date: '2026-10-16T08:00:00.000Z' });

      expect((await repos.forgotEvents.getAll()).map((event) => event.id)).toEqual(['f3', 'f2', 'f1']);
      expect((await repos.forgotEvents.getByRoutine('r1')).map((event) => event.id)).toEqual(['f3', 'f1']);
    });

    it('una etiqueta vacía o de más de 60 caracteres no se guarda ni se encola', async () => {
      const { store, repos } = setup();

      await expect(repos.forgotEvents.add({ routineId: 'r1', label: '   ' })).rejects.toBeInstanceOf(RepositoryError);
      await expect(repos.forgotEvents.add({ routineId: 'r1', label: 'x'.repeat(61) })).rejects.toMatchObject({ code: '23514' });
      expect(await store.read()).toMatchObject({ forgotEvents: [], outbox: [] });
    });

    it('guarda como mucho 500 olvidos: salen los más viejos', async () => {
      const { repos } = setup();
      for (let index = 0; index < 501; index += 1) {
        await repos.forgotEvents.add({
          id: `f${index}`,
          routineId: 'r1',
          label: 'Llaves',
          date: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
        });
      }

      const events = await repos.forgotEvents.getAll();
      expect(events).toHaveLength(500);
      expect(events.some((event) => event.id === 'f0')).toBe(false);
    });

    it('borrar la rutina quita sus olvidos del teléfono y de la cola, no los de otras', async () => {
      const { store, repos } = setup();
      const routine = await repos.routines.create({ name: 'Casa' });
      await store.update((doc) => ({ doc: { ...doc, outbox: [] }, result: null })); // ya subida
      await repos.forgotEvents.add({ id: 'f1', routineId: routine.id, label: 'Llaves' });
      await repos.forgotEvents.add({ id: 'f2', routineId: 'other', label: 'Gafas' });

      await repos.routines.delete(routine.id);

      const doc = await store.read();
      expect(doc.forgotEvents?.map((event) => event.id)).toEqual(['f2']);
      expect(doc.outbox.map((pending) => pending.kind)).toEqual(['insertForgot', 'deleteRoutine']);
      expect(doc.outbox[0]).toMatchObject({ event: { id: 'f2' } });
    });
  });
});
