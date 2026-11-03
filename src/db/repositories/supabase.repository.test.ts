import type { SupabaseClient } from '@supabase/supabase-js';

import { createForgotEventRepository } from './forgot-event.repository';
import { createRoutineRepository } from './routine.repository';
import { RepositoryError } from './repository.types';
import { createSettingsRepository } from './settings.repository';

type Call = [method: string, ...args: unknown[]];
interface FakeResponse {
  data: unknown;
  error: { code: string; message: string } | null;
  status: number;
}

/** Cliente falso: anota la consulta que arma el repositorio y responde `response`. */
function fakeClient(response: FakeResponse) {
  const calls: Call[] = [];
  const builder: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (value: FakeResponse) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(response).then(resolve, reject);
        }
        return (...args: unknown[]) => {
          calls.push([String(prop), ...args]);
          return builder;
        };
      },
    },
  );
  const client = {
    from: (table: string) => {
      calls.push(['from', table]);
      return builder;
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

const ROUTINE_ROW = {
  id: 'routine-1',
  user_id: 'user-1',
  name: 'Salir de casa',
  icon: null,
  color: null,
  active: true,
  last_completed_at: null,
  created_at: '2026-10-14T10:00:00.000Z',
  updated_at: '2026-10-14T10:05:00.000Z',
};

describe('createSupabaseRepository (vía routine.repository)', () => {
  it('inserta con el id y la hora de cambio del cliente', async () => {
    const { client, calls } = fakeClient({ data: ROUTINE_ROW, error: null, status: 201 });

    await createRoutineRepository(client).create({
      id: 'routine-1',
      name: 'Salir de casa',
      updatedAt: '2026-10-14T10:05:00.000Z',
    });

    expect(calls).toContainEqual([
      'insert',
      { id: 'routine-1', name: 'Salir de casa', updated_at: '2026-10-14T10:05:00.000Z' },
    ]);
  });

  it('devuelve la entidad con updatedAt', async () => {
    const { client } = fakeClient({ data: ROUTINE_ROW, error: null, status: 201 });

    const routine = await createRoutineRepository(client).create({ name: 'Salir de casa' });

    expect(routine.updatedAt).toBe('2026-10-14T10:05:00.000Z');
  });

  it('updateIfOlder solo actualiza si la fila no tiene un cambio posterior, y guarda esa hora', async () => {
    const { client, calls } = fakeClient({ data: [ROUTINE_ROW], error: null, status: 200 });
    const at = '2026-10-14T11:00:00.000Z';

    await createRoutineRepository(client).updateIfOlder('routine-1', { name: 'Trabajo' }, at);

    expect(calls).toEqual([
      ['from', 'routines'],
      ['update', { name: 'Trabajo', updated_at: at }],
      ['eq', 'id', 'routine-1'],
      ['lte', 'updated_at', at],
      ['select'],
    ]);
  });

  it("updateIfOlder devuelve 'applied' si la fila se actualizó", async () => {
    const { client } = fakeClient({ data: [ROUTINE_ROW], error: null, status: 200 });

    await expect(
      createRoutineRepository(client).updateIfOlder('routine-1', { name: 'Trabajo' }, '2026-10-14T11:00:00.000Z'),
    ).resolves.toBe('applied');
  });

  it("updateIfOlder devuelve 'stale' si el servidor tiene un cambio más reciente (o la fila ya no existe)", async () => {
    const { client } = fakeClient({ data: [], error: null, status: 200 });

    await expect(
      createRoutineRepository(client).updateIfOlder('routine-1', { name: 'Trabajo' }, '2026-10-14T09:00:00.000Z'),
    ).resolves.toBe('stale');
  });

  it('updateIfOlder sin red falla con un error de red (reintentable)', async () => {
    const { client } = fakeClient({ data: null, error: { code: '', message: 'Network request failed' }, status: 0 });

    const result = createRoutineRepository(client).updateIfOlder('routine-1', { name: 'X' }, '2026-10-14T11:00:00.000Z');

    await expect(result).rejects.toBeInstanceOf(RepositoryError);
    await expect(result).rejects.toMatchObject({ kind: 'network', operation: 'updateIfOlder' });
  });

  it('mapea el tipo de rutina en las dos direcciones (sin columna todavía, es de salida)', async () => {
    const { client, calls } = fakeClient({ data: { ...ROUTINE_ROW, kind: 'arrival' }, error: null, status: 201 });
    const routines = createRoutineRepository(client);

    await expect(routines.create({ id: 'routine-1', name: 'Llegar', kind: 'arrival' })).resolves.toMatchObject({ kind: 'arrival' });
    expect(calls).toContainEqual(['insert', expect.objectContaining({ kind: 'arrival' })]);

    const legacy = fakeClient({ data: [ROUTINE_ROW], error: null, status: 200 });
    await expect(createRoutineRepository(legacy.client).getAll()).resolves.toEqual([
      expect.objectContaining({ kind: 'departure' }),
    ]);
  });

  it('en ajustes, updateIfOlder identifica la fila por user_id', async () => {
    const { client, calls } = fakeClient({ data: [{}], error: null, status: 200 });

    await createSettingsRepository(client).updateIfOlder('user-1', { sound: false }, '2026-10-14T11:00:00.000Z');

    expect(calls).toContainEqual(['eq', 'user_id', 'user-1']);
  });
});

describe('createForgotEventRepository', () => {
  const event = { id: 'f1', routineId: 'r1', recordId: null, label: 'Llaves', date: '2026-10-14T10:00:00.000Z' };

  it('inserta con upsert que ignora duplicados (reintentar no falla ni duplica)', async () => {
    const { client, calls } = fakeClient({ data: null, error: null, status: 201 });

    await createForgotEventRepository(client).create(event);

    expect(calls).toEqual([
      ['from', 'forgot_events'],
      ['upsert', { id: 'f1', routine_id: 'r1', record_id: null, label: 'Llaves', date: event.date }, { onConflict: 'id', ignoreDuplicates: true }],
    ]);
  });

  it('baja los olvidos del más reciente al más antiguo, en forma de dominio', async () => {
    const row = { id: 'f1', routine_id: 'r1', record_id: 'rec-1', label: 'Llaves', date: event.date };
    const { client, calls } = fakeClient({ data: [row], error: null, status: 200 });

    await expect(createForgotEventRepository(client).getAll()).resolves.toEqual([{ ...event, recordId: 'rec-1' }]);
    expect(calls).toContainEqual(['order', 'date', { ascending: false }]);
  });

  it('sin red falla con un error de red (reintentable)', async () => {
    const { client } = fakeClient({ data: null, error: { code: '', message: 'Network request failed' }, status: 0 });

    await expect(createForgotEventRepository(client).create(event)).rejects.toMatchObject({ kind: 'network' });
  });
});
