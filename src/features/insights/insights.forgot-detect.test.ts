import type { ForgotEvent } from '@/shared/types/forgot-event.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { detectForgotPatterns, detectPatterns, itemKey, localWeekday, patternKey, PATTERN_RULES } from './insights.detect';

// Todo en hora de Bogotá (UTC−5, sin horario de verano), sin depender de la zona del equipo que corre el test.
const BOGOTA = () => -300;
/** Instante de una hora local de Bogotá. */
const bogota = (month: number, day: number, hour = 7, minute = 0) => new Date(Date.UTC(2026, month - 1, day, hour + 5, minute));
// Miércoles 4 de noviembre de 2026, 12:00 en Bogotá.
const NOW = bogota(11, 4, 12);
// Lunes de las últimas semanas (todos dentro de la ventana de 8 semanas).
const MONDAYS: [number, number][] = [
  [11, 2],
  [10, 26],
  [10, 19],
  [10, 12],
  [10, 5],
];

let seq = 0;
const record = (date: Date, routineId = 'r1'): VerificationRecord => ({
  id: `rec-${++seq}`,
  routineId,
  date: date.toISOString(),
  result: 'completed',
  itemsChecked: null,
  durationSeconds: 10,
});
const forgot = (date: Date, label = 'Llaves', routineId = 'r1'): ForgotEvent => ({
  id: `f-${++seq}`,
  routineId,
  recordId: null,
  label,
  date: date.toISOString(),
});

const mondays = (count: number, hour = 7) => MONDAYS.slice(0, count).map(([month, day]) => bogota(month, day, hour));
const detect = (events: ForgotEvent[], records: VerificationRecord[], routineIds?: Set<string>) =>
  detectForgotPatterns(events, records, NOW, BOGOTA, routineIds);

describe('detectForgotPatterns', () => {
  it('3 olvidos el mismo día de la semana con 4 salidas ese día → patrón', () => {
    const events = mondays(3).map((date) => forgot(date));
    const records = mondays(4).map((date) => record(date));
    expect(detect(events, records)).toEqual([
      { kind: 'forgot_weekday', routineId: 'r1', label: 'Llaves', weekday: 1, misses: 3, observations: 4 },
    ]);
  });

  it('justo por debajo de cada umbral no hay patrón', () => {
    // 2 olvidos (con 4 salidas).
    expect(detect(mondays(2).map((date) => forgot(date)), mondays(4).map((date) => record(date)))).toEqual([]);
    // 3 olvidos pero solo 3 salidas ese día (las de los propios olvidos).
    expect(detect(mondays(3).map((date) => forgot(date)), mondays(3).map((date) => record(date)))).toEqual([]);
    expect(PATTERN_RULES).toMatchObject({ forgotMisses: 3, forgotOutings: 4, forgotWeeks: 8 });
  });

  it('un olvido cuenta como salida aunque no haya verificación ese día', () => {
    const events = mondays(4).map((date) => forgot(date));
    expect(detect(events, [])).toEqual([expect.objectContaining({ misses: 4, observations: 4 })]);
  });

  it('varios olvidos del mismo ítem el mismo día cuentan una vez', () => {
    const events = [...mondays(2).map((date) => forgot(date)), forgot(bogota(11, 2, 8)), forgot(bogota(11, 2, 9))];
    expect(detect(events, mondays(4).map((date) => record(date)))).toEqual([]);
  });

  it('a las 23:30 de un lunes en Bogotá sigue siendo lunes (en UTC ya es martes)', () => {
    const late = mondays(3, 23).map((date) => new Date(date.getTime() + 30 * 60_000));
    expect(late[0].getUTCDay()).toBe(2);
    expect(localWeekday(late[0].getTime(), BOGOTA)).toBe(1);
    const [pattern] = detect(late.map((date) => forgot(date)), mondays(4, 23).map((date) => record(date)));
    expect(pattern).toMatchObject({ weekday: 1, misses: 3, observations: 4 });
  });

  it('a las 00:30 del martes ya cuenta como martes', () => {
    const tuesdays = mondays(3).map((date) => new Date(date.getTime() + 17.5 * 60 * 60_000)); // lunes 7:00 → martes 00:30
    const [pattern] = detect(tuesdays.map((date) => forgot(date)), [...tuesdays, bogota(10, 6, 7)].map((date) => record(date)));
    expect(pattern).toMatchObject({ weekday: 2, misses: 3, observations: 4 });
  });

  it('solo cuentan las últimas 8 semanas (hoy incluido)', () => {
    // Jueves 10 de septiembre es el primer día de la ventana; el 3 de septiembre ya queda fuera.
    const thursdays = (first: Date) => [first, bogota(9, 17), bogota(9, 24)];
    const outings = [bogota(10, 1)].map((date) => record(date));
    expect(detect(thursdays(bogota(9, 10)).map((date) => forgot(date)), outings)).toEqual([
      expect.objectContaining({ weekday: 4, misses: 3, observations: 4 }),
    ]);
    expect(detect(thursdays(bogota(9, 3)).map((date) => forgot(date)), outings)).toEqual([]);
    // Lo que tiene fecha futura no cuenta.
    const future = [bogota(11, 9), bogota(11, 16), bogota(11, 23)].map((date) => forgot(date));
    expect(detect(future, mondays(4).map((date) => record(date)))).toEqual([]);
  });

  it('agrupa la etiqueta sin mayúsculas, tildes ni espacios de más; muestra la más reciente', () => {
    const [first, second, third] = mondays(3);
    const events = [forgot(third, 'LLÁVES de casa'), forgot(second, '  llaves  de  casa '), forgot(first, 'Llaves  de casa')];
    const [pattern] = detect(events, mondays(4).map((date) => record(date)));
    expect(pattern).toMatchObject({ label: 'Llaves de casa', misses: 3 });
    expect(itemKey('  LLÁVES   de casa')).toBe('llaves de casa');
    expect(itemKey('Cañón')).toBe('canon');
  });

  it('ignora los olvidos (y salidas) de rutinas que ya no existen', () => {
    const events = mondays(3).map((date) => forgot(date, 'Llaves', 'gone'));
    const records = mondays(4).map((date) => record(date, 'gone'));
    expect(detect(events, records)).toHaveLength(1);
    expect(detect(events, records, new Set(['r1']))).toEqual([]);
  });

  it('las salidas son de la misma rutina', () => {
    const events = mondays(3).map((date) => forgot(date));
    expect(detect(events, [record(bogota(10, 5), 'r2')])).toEqual([]);
  });

  it('unificado con los patrones de omisión: claves distintas y el mismo cálculo de día', () => {
    const [pattern] = detect(mondays(3).map((date) => forgot(date)), mondays(4).map((date) => record(date)));
    expect(patternKey(pattern)).toBe('forgot_weekday|r1|llaves|1');
    expect(patternKey({ ...pattern, kind: 'weekday', critical: false })).toBe('weekday|r1|llaves|1');

    // detectPatterns también usa el día local de offsetOf: 3 omisiones a las 23:30 del lunes → lunes.
    const late = mondays(4, 23).map((date, index) => ({
      ...record(new Date(date.getTime() + 30 * 60_000)),
      result: 'partial' as const,
      itemsChecked: [{ label: 'Llaves', critical: false, checked: index === 3 }],
    }));
    const weekday = detectPatterns(late, NOW, BOGOTA).find((found) => found.kind === 'weekday');
    expect(weekday).toMatchObject({ weekday: 1, misses: 3, observations: 4 });
  });
});
