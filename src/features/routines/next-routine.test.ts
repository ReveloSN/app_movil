import type { Routine } from '@/shared/types/routine.types';
import type { Trigger } from '@/shared/types/trigger.types';

import { findNextRoutine } from './next-routine';

const routine = (id: string, name: string, active = true): Routine => ({
  id,
  userId: 'u1',
  name,
  icon: null,
  color: null,
  active,
  lastCompletedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const schedule = (id: string, routineId: string, time: string, days: number[], active = true): Trigger => ({
  id,
  routineId,
  type: 'schedule',
  time,
  days,
  networkId: null,
  windowStart: null,
  windowEnd: null,
  active,
  updatedAt: '2026-10-01T00:00:00.000Z',
});

// Sábado 17 de octubre de 2026, 10:00 (hora local del teléfono).
const SATURDAY_10AM = new Date(2026, 9, 17, 10, 0);

describe('próxima rutina (P03-2)', () => {
  it('elige la más cercana en el futuro entre varias rutinas', () => {
    const next = findNextRoutine(
      [routine('r1', 'Estudio'), routine('r2', 'Dormir')],
      [schedule('t1', 'r1', '18:00:00', [6]), schedule('t2', 'r2', '22:30:00', [6]), schedule('t3', 'r2', '12:00:00', [6])],
      SATURDAY_10AM,
    );
    expect(next).toEqual({ routineId: 'r2', routineName: 'Dormir', at: new Date(2026, 9, 17, 12, 0) });
  });

  it('una hora ya pasada hoy salta al siguiente día que toca, cruzando la medianoche', () => {
    const next = findNextRoutine([routine('r1', 'Salir')], [schedule('t1', 'r1', '07:00:00', [0, 1])], SATURDAY_10AM);
    expect(next?.at).toEqual(new Date(2026, 9, 18, 7, 0)); // domingo
  });

  it('cruza la semana: el mismo día de hoy, a una hora ya pasada, es dentro de 7 días', () => {
    const next = findNextRoutine([routine('r1', 'Salir')], [schedule('t1', 'r1', '09:00:00', [6])], SATURDAY_10AM);
    expect(next?.at).toEqual(new Date(2026, 9, 24, 9, 0));
  });

  it('la hora exacta de ahora no cuenta: tiene que ser futura', () => {
    const next = findNextRoutine([routine('r1', 'Salir')], [schedule('t1', 'r1', '10:00:00', [6])], SATURDAY_10AM);
    expect(next?.at).toEqual(new Date(2026, 9, 24, 10, 0));
  });

  it('ignora avisos de Wi-Fi, avisos pausados, rutinas pausadas y avisos sin días', () => {
    const wifi: Trigger = { ...schedule('t1', 'r1', '11:00:00', [6]), type: 'wifi_exit' };
    const next = findNextRoutine(
      [routine('r1', 'Salir'), routine('r2', 'Pausada', false)],
      [wifi, schedule('t2', 'r1', '11:00:00', [6], false), schedule('t3', 'r2', '11:00:00', [6]), schedule('t4', 'r1', '11:00:00', [])],
      SATURDAY_10AM,
    );
    expect(next).toBeNull();
  });
});
