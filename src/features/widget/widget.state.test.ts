import type { Item } from '@/shared/types/item.types';
import type { Routine } from '@/shared/types/routine.types';
import type { Trigger } from '@/shared/types/trigger.types';

import { buildWidgetState, MAX_WIDGET_ITEMS } from './widget.state';

const routine = (id: string, name: string): Routine => ({
  id,
  userId: 'u1',
  name,
  icon: null,
  color: null,
  active: true,
  lastCompletedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const item = (id: string, routineId: string, label: string, critical = false, sortOrder = 0): Item => ({
  id,
  routineId,
  label,
  icon: null,
  type: 'carry',
  critical,
  note: null,
  sortOrder,
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const dailyAt = (routineId: string, time: string): Trigger => ({
  id: `t-${routineId}`,
  routineId,
  type: 'schedule',
  time,
  days: [0, 1, 2, 3, 4, 5, 6],
  networkId: null,
  windowStart: null,
  windowEnd: null,
  active: true,
  updatedAt: '2026-10-01T00:00:00.000Z',
});

// Martes 3 de noviembre de 2026, 10:00 hora local.
const NOW = new Date(2026, 10, 3, 10, 0);

const base = {
  routines: [routine('r1', 'Salir de casa'), routine('r2', 'Cerrar el estudio')],
  triggers: [dailyAt('r1', '08:00:00'), dailyAt('r2', '18:00:00')],
  now: NOW,
};

describe('buildWidgetState', () => {
  it('muestra la próxima rutina con sus ítems y el conteo', () => {
    const state = buildWidgetState({
      ...base,
      items: [item('a', 'r2', 'Llaves', false, 0), item('b', 'r2', 'Billetera', false, 1), item('x', 'r1', 'Otro')],
      checkedIds: ['a'],
    });
    expect(state).toMatchObject({ routineId: 'r2', routineName: 'Cerrar el estudio', checked: 1, total: 2, hiddenCount: 0 });
    expect(state?.items.map((entry) => [entry.label, entry.checked])).toEqual([
      ['Billetera', false],
      ['Llaves', true],
    ]);
  });

  it('pone primero los críticos sin marcar y deja al final lo ya marcado', () => {
    const state = buildWidgetState({
      ...base,
      items: [item('a', 'r2', 'Llaves', false, 0), item('b', 'r2', 'Estufa apagada', true, 1), item('c', 'r2', 'Billetera', false, 2)],
      checkedIds: ['b'],
    });
    expect(state?.items.map((entry) => entry.label)).toEqual(['Llaves', 'Billetera', 'Estufa apagada']);
  });

  it(`muestra como mucho ${MAX_WIDGET_ITEMS} ítems y cuenta los que faltan por mostrar`, () => {
    const items = Array.from({ length: 7 }, (_, index) => item(`i${index}`, 'r2', `Ítem ${index}`, false, index));
    const state = buildWidgetState({ ...base, items, checkedIds: [] });
    expect(state?.items).toHaveLength(MAX_WIDGET_ITEMS);
    expect(state?.hiddenCount).toBe(3);
    expect(state?.total).toBe(7);
  });

  it('es null si no hay próxima rutina o la rutina no tiene ítems', () => {
    expect(buildWidgetState({ ...base, triggers: [], items: [item('a', 'r2', 'Llaves')], checkedIds: [] })).toBeNull();
    expect(buildWidgetState({ ...base, items: [], checkedIds: [] })).toBeNull();
  });
});
