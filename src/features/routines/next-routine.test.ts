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
    expect(next).toEqual({ kind: 'schedule', routineId: 'r2', routineName: 'Dormir', at: new Date(2026, 9, 17, 12, 0) });
  });

  it('una hora ya pasada hoy salta al siguiente día que toca, cruzando la medianoche', () => {
    const next = findNextRoutine([routine('r1', 'Salir')], [schedule('t1', 'r1', '07:00:00', [0, 1])], SATURDAY_10AM);
    expect(next).toMatchObject({ at: new Date(2026, 9, 18, 7, 0) }); // domingo
  });

  it('cruza la semana: el mismo día de hoy, a una hora ya pasada, es dentro de 7 días', () => {
    const next = findNextRoutine([routine('r1', 'Salir')], [schedule('t1', 'r1', '09:00:00', [6])], SATURDAY_10AM);
    expect(next).toMatchObject({ at: new Date(2026, 9, 24, 9, 0) });
  });

  it('la hora exacta de ahora no cuenta: tiene que ser futura', () => {
    const next = findNextRoutine([routine('r1', 'Salir')], [schedule('t1', 'r1', '10:00:00', [6])], SATURDAY_10AM);
    expect(next).toMatchObject({ at: new Date(2026, 9, 24, 10, 0) });
  });

  it('ignora avisos pausados, rutinas pausadas y avisos sin días', () => {
    const next = findNextRoutine(
      [routine('r1', 'Salir'), routine('r2', 'Pausada', false)],
      [schedule('t2', 'r1', '11:00:00', [6], false), schedule('t3', 'r2', '11:00:00', [6]), schedule('t4', 'r1', '11:00:00', [])],
      SATURDAY_10AM,
    );
    expect(next).toBeNull();
  });

  describe('avisos por Wi-Fi', () => {
    const wifi = (id: string, routineId: string, type: 'wifi_exit' | 'wifi_enter', window?: [string, string], active = true): Trigger => ({
      ...schedule(id, routineId, '00:00:00', []),
      type,
      time: null,
      days: null,
      networkId: 'n1',
      windowStart: window?.[0] ?? null,
      windowEnd: window?.[1] ?? null,
      active,
    });

    it('sin horario, una rutina por Wi-Fi sin franja es la próxima', () => {
      const next = findNextRoutine([routine('r1', 'Salir')], [wifi('t1', 'r1', 'wifi_exit')], SATURDAY_10AM);
      expect(next).toEqual({ kind: 'wifi_exit', routineId: 'r1', routineName: 'Salir' });
    });

    it('un horario futuro gana a un Wi-Fi sin franja', () => {
      const next = findNextRoutine(
        [routine('r1', 'Salir'), routine('r2', 'Estudio')],
        [wifi('t1', 'r1', 'wifi_exit'), schedule('t2', 'r2', '18:00:00', [6])],
        SATURDAY_10AM,
      );
      expect(next).toMatchObject({ kind: 'schedule', routineId: 'r2' });
    });

    it('un Wi-Fi cuya franja cubre ahora gana al horario: avisaría ya mismo', () => {
      const next = findNextRoutine(
        [routine('r1', 'Salir'), routine('r2', 'Estudio')],
        [wifi('t1', 'r1', 'wifi_exit', ['08:00:00', '12:00:00']), schedule('t2', 'r2', '10:30:00', [6])],
        SATURDAY_10AM,
      );
      expect(next).toMatchObject({ kind: 'wifi_exit', routineId: 'r1' });
    });

    it('un Wi-Fi con franja que no cubre ahora no cuenta', () => {
      const next = findNextRoutine([routine('r1', 'Salir')], [wifi('t1', 'r1', 'wifi_exit', ['18:00:00', '22:00:00'])], SATURDAY_10AM);
      expect(next).toBeNull();
    });

    it('llegar al Wi-Fi también cuenta; pausado o de una rutina pausada, no', () => {
      expect(findNextRoutine([routine('r1', 'Llegar')], [wifi('t1', 'r1', 'wifi_enter')], SATURDAY_10AM)).toMatchObject({ kind: 'wifi_enter' });
      expect(findNextRoutine([routine('r1', 'Llegar')], [wifi('t1', 'r1', 'wifi_enter', undefined, false)], SATURDAY_10AM)).toBeNull();
      expect(findNextRoutine([routine('r1', 'Llegar', false)], [wifi('t1', 'r1', 'wifi_enter')], SATURDAY_10AM)).toBeNull();
    });
  });
});
