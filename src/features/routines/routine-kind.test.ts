import { departureRecords, departureRoutineIdsOf, departureSummary } from '@/features/history/stats';
import { buildWidgetState } from '@/features/widget/widget.state';
import type { Item } from '@/shared/types/item.types';
import type { Routine, RoutineKind } from '@/shared/types/routine.types';
import type { Trigger } from '@/shared/types/trigger.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { findNextRoutine } from './next-routine';
import { arrivalRoutines, departureRoutines } from './routine-list';
import { toRoutineDraft } from './routine.draft';
import { createRoutineWithItems } from './routine.service';

const routine = (id: string, kind: RoutineKind): Routine => ({
  id,
  userId: 'u1',
  name: id,
  kind,
  icon: null,
  color: null,
  active: true,
  lastCompletedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const trigger = (routineId: string, type: Trigger['type'], time: string | null = null): Trigger => ({
  id: `t-${routineId}`,
  routineId,
  type,
  time,
  days: type === 'schedule' ? [0, 1, 2, 3, 4, 5, 6] : null,
  networkId: null,
  windowStart: null,
  windowEnd: null,
  active: true,
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const item = (id: string, routineId: string): Item => ({
  id,
  routineId,
  label: id,
  icon: null,
  type: 'do',
  critical: false,
  note: null,
  sortOrder: 0,
  updatedAt: '2026-10-01T00:00:00.000Z',
});

// Martes 3 de noviembre de 2026, 10:00 hora local.
const NOW = new Date(2026, 10, 3, 10, 0);
const routines = [routine('salir', 'departure'), routine('llegar', 'arrival')];

describe('filtrado por tipo de rutina', () => {
  it('separa las salidas de las llegadas', () => {
    expect(departureRoutines(routines).map((r) => r.id)).toEqual(['salir']);
    expect(arrivalRoutines(routines).map((r) => r.id)).toEqual(['llegar']);
  });

  it('la próxima rutina ignora las de llegada, aunque su aviso toque antes', () => {
    const triggers = [trigger('llegar', 'schedule', '11:00:00'), trigger('salir', 'schedule', '18:00:00')];
    expect(findNextRoutine(routines, triggers, NOW)).toMatchObject({ routineId: 'salir' });
    expect(findNextRoutine([routine('llegar', 'arrival')], [trigger('llegar', 'wifi_enter')], NOW)).toBeNull();
  });

  it('el widget no muestra rutinas de llegada', () => {
    const items = [item('a', 'llegar'), item('b', 'salir')];
    const state = buildWidgetState({
      routines,
      items,
      triggers: [trigger('llegar', 'schedule', '11:00:00'), trigger('salir', 'schedule', '18:00:00')],
      checkedIds: [],
      now: NOW,
    });
    expect(state?.routineId).toBe('salir');
    expect(
      buildWidgetState({ routines: [routine('llegar', 'arrival')], items, triggers: [trigger('llegar', 'wifi_enter')], checkedIds: [], now: NOW }),
    ).toBeNull();
  });

  it('la racha de salidas no cuenta las verificaciones de llegada', () => {
    const record = (id: string, routineId: string, day: number): VerificationRecord => ({
      id,
      routineId,
      date: `2026-11-${String(day).padStart(2, '0')}T12:00:00.000Z`,
      result: 'completed',
      itemsChecked: null,
      durationSeconds: 10,
    });
    const records = [record('a', 'salir', 3), record('b', 'llegar', 2), record('c', 'llegar', 3)];
    const ids = departureRoutineIdsOf(routines);

    expect(departureRecords(records, ids).map((r) => r.id)).toEqual(['a']);
    const summary = departureSummary(records, ids, new Date('2026-11-03T15:00:00.000Z'), () => -300);
    expect(summary.totalDepartures).toBe(1);
    expect(summary.currentStreak).toBe(1);
  });
});

describe('tipo de rutina al guardar', () => {
  it('el borrador lleva el tipo y por defecto es de salida', () => {
    const base = { name: 'Casa', items: [], triggers: [] };
    expect(toRoutineDraft(base).kind).toBe('departure');
    expect(toRoutineDraft({ ...base, kind: 'arrival' }).kind).toBe('arrival');
  });

  it('crear una rutina de llegada guarda kind = arrival', async () => {
    const create = jest.fn().mockResolvedValue(routine('nueva', 'arrival'));
    const deps = {
      routines: { create, delete: jest.fn() },
      items: { create: jest.fn().mockResolvedValue(item('i', 'nueva')), delete: jest.fn() },
      triggers: { create: jest.fn(), delete: jest.fn() },
      homeNetworks: { getAll: jest.fn().mockResolvedValue([]), create: jest.fn() },
    };
    await createRoutineWithItems(
      deps as unknown as Parameters<typeof createRoutineWithItems>[0],
      { name: 'Llegar a casa', kind: 'arrival', items: [{ label: 'Llaves', kind: 'do', critical: false }] },
    );
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Llegar a casa', kind: 'arrival' }));
  });
});
