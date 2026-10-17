import type { HomeNetwork } from '@/shared/types/home-network.types';
import type { Item } from '@/shared/types/item.types';
import type { Routine } from '@/shared/types/routine.types';

import type { LocalDocument, LocalTables } from '../local/local-document.types';
import { emptyDocument } from '../local/local.store';
import { op } from '../local/testing/outbox.fixtures';
import { mergePulled } from './sync.merge';

const routine = (id: string, overrides: Partial<Routine> = {}): Routine => ({
  id,
  userId: 'user-1',
  name: `Rutina ${id}`,
  icon: null,
  color: null,
  active: true,
  lastCompletedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

const item = (id: string, routineId: string): Item => ({
  id,
  routineId,
  label: `Ítem ${id}`,
  icon: null,
  type: 'carry',
  critical: false,
  note: null,
  sortOrder: 0,
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const tables = (partial: Partial<LocalTables>): LocalTables => ({ ...emptyDocument().tables, ...partial });
const doc = (local: Partial<LocalTables>, outbox: LocalDocument['outbox'] = []): LocalDocument => ({
  ...emptyDocument(),
  tables: tables(local),
  outbox,
});

describe('mergePulled', () => {
  it('lo del servidor reemplaza a lo local que no tiene cambios pendientes', () => {
    const merged = mergePulled(doc({ routines: [routine('r1', { name: 'Vieja' })] }), tables({ routines: [routine('r1', { name: 'Nueva' })] }));

    expect(merged.routines).toEqual([routine('r1', { name: 'Nueva' })]);
  });

  it('una fila con cambios pendientes conserva lo local, pero lo que pone el servidor (última vez, creación, dueño) viene del servidor', () => {
    const local = routine('r1', { name: 'Editada sin red', lastCompletedAt: null, updatedAt: '2026-10-14T10:00:00.000Z' });
    const remote = routine('r1', { name: 'Del servidor', lastCompletedAt: '2026-10-14T09:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' });

    const merged = mergePulled(
      doc({ routines: [local] }, [op({ kind: 'update', table: 'routines', id: 'r1', changes: { name: 'Editada sin red' } })]),
      tables({ routines: [remote] }),
    );

    expect(merged.routines[0]).toEqual({
      ...local,
      lastCompletedAt: '2026-10-14T09:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    });
  });

  it('una fila creada sin red que aún no se subió se conserva', () => {
    const merged = mergePulled(
      doc({ routines: [routine('local-1')] }, [op({ kind: 'insert', table: 'routines', id: 'local-1', values: {} })]),
      tables({}),
    );

    expect(merged.routines.map((row) => row.id)).toEqual(['local-1']);
  });

  it('una fila borrada en otro dispositivo (y sin nada pendiente aquí) desaparece', () => {
    const merged = mergePulled(doc({ routines: [routine('r1')], items: [item('i1', 'r1')] }), tables({}));

    expect(merged).toMatchObject({ routines: [], items: [] });
  });

  it('lo que se borró aquí y aún no se subió no vuelve a aparecer (rutina, sus hijos e ítems sueltos)', () => {
    const merged = mergePulled(
      doc({ routines: [routine('r2')] }, [
        op({ kind: 'deleteRoutine', id: 'r1' }),
        op({ kind: 'delete', table: 'items', id: 'i9' }),
      ]),
      tables({ routines: [routine('r1'), routine('r2')], items: [item('i1', 'r1'), item('i9', 'r2')] }),
    );

    expect(merged.routines.map((row) => row.id)).toEqual(['r2']);
    expect(merged.items).toEqual([]);
  });

  it('las redes nuevas del servidor llegan, y sin cambios devuelve el mismo objeto (nada que avisar)', () => {
    const network: HomeNetwork = {
      id: 'n1',
      userId: 'user-1',
      displayName: 'Casa',
      ssid: 'MiWifi',
      place: null,
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    const before = doc({ homeNetworks: [network] });

    expect(mergePulled(before, tables({ homeNetworks: [{ ...network }] }))).toBe(before.tables);
  });
});
