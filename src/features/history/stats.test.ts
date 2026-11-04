import type { VerificationRecord } from '@/shared/types/verification-record.types';

import type { UtcOffsetMinutes } from './history.streak';
import {
  bestStreak,
  completionRate,
  departureRecords,
  departureRoutineIdsOf,
  departureSummary,
  globalStreak,
  weeklySeries,
} from './stats';

let seq = 0;
const rec = (date: string, result = 'completed', routineId = 'out'): VerificationRecord => ({
  id: `r${++seq}`,
  routineId,
  date,
  result,
  itemsChecked: null,
  durationSeconds: 10,
});

/** Mediodía UTC de un día de noviembre de 2026 (mismo día local en Bogotá y en Tokio). */
const nov = (day: number, time = '12:00') => `2026-11-${String(day).padStart(2, '0')}T${time}:00.000Z`;

// Desfases inyectados: los tests no dependen de la zona horaria de la máquina que los corre.
const BOGOTA: UtcOffsetMinutes = () => -300;
const TOKYO: UtcOffsetMinutes = () => 540;

// Miércoles 4 de noviembre de 2026, 10:00 en Bogotá (15:00 UTC; 00:00 del jueves 5 en Tokio).
const NOW = new Date('2026-11-04T15:00:00.000Z');

describe('departureRoutineIdsOf / departureRecords', () => {
  const routines = [
    { id: 'out', kind: 'departure' as const },
    { id: 'home', kind: 'arrival' as const },
  ];

  it('solo deja las rutinas de salida', () => {
    expect([...departureRoutineIdsOf(routines)]).toEqual(['out']);
  });

  it('excluye llegadas y rutinas borradas o ausentes', () => {
    const records = [rec(nov(1)), rec(nov(1), 'completed', 'home'), rec(nov(1), 'completed', 'deleted')];
    expect(departureRecords(records, departureRoutineIdsOf(routines)).map((record) => record.routineId)).toEqual(['out']);
  });
});

describe('globalStreak', () => {
  it('cuenta días seguidos con al menos una completa, terminando hoy', () => {
    expect(globalStreak([rec(nov(4)), rec(nov(3)), rec(nov(2))], NOW, BOGOTA)).toBe(3);
  });

  it('si hoy aún no hay registro, cuenta desde ayer', () => {
    expect(globalStreak([rec(nov(3)), rec(nov(2))], NOW, BOGOTA)).toBe(2);
  });

  it('la racha se rompe con un día sin completa; antes de ayer ya no hay racha', () => {
    expect(globalStreak([rec(nov(4)), rec(nov(2)), rec(nov(1))], NOW, BOGOTA)).toBe(1);
    expect(globalStreak([rec(nov(2)), rec(nov(1))], NOW, BOGOTA)).toBe(0);
  });

  it('un día con solo parciales, omitidas o sin respuesta rompe la racha', () => {
    const records = [rec(nov(4)), rec(nov(3), 'partial'), rec(nov(3), 'skipped'), rec(nov(3), 'no_response'), rec(nov(2))];
    expect(globalStreak(records, NOW, BOGOTA)).toBe(1);
  });

  it('varios registros el mismo día (de varias rutinas) cuentan una vez', () => {
    const records = [rec(nov(4)), rec(nov(4, '13:00')), rec(nov(4, '14:00'), 'completed', 'gym'), rec(nov(3))];
    expect(globalStreak(records, NOW, BOGOTA)).toBe(2);
  });

  it('suma rutinas distintas: cada día basta una completa de cualquiera', () => {
    expect(globalStreak([rec(nov(4), 'completed', 'a'), rec(nov(3), 'completed', 'b')], NOW, BOGOTA)).toBe(2);
  });

  it('sin registros o con fechas inválidas, 0', () => {
    expect(globalStreak([], NOW, BOGOTA)).toBe(0);
    expect(globalStreak([rec('no es fecha')], NOW, BOGOTA)).toBe(0);
  });

  it('medianoche en Bogotá: 23:30 es del día anterior y 00:30 del siguiente', () => {
    // 23:30 del 2 en Bogotá = 04:30 UTC del 3; 00:30 del 4 en Bogotá = 05:30 UTC del 4.
    const lateNight = rec('2026-11-03T04:30:00.000Z');
    const pastMidnight = rec('2026-11-04T05:30:00.000Z');
    expect(globalStreak([lateNight, pastMidnight], NOW, BOGOTA)).toBe(1); // días 2 y 4: hay hueco el 3.
    expect(globalStreak([lateNight, rec(nov(3)), pastMidnight], NOW, BOGOTA)).toBe(3);
  });

  it('con desfase positivo (Tokio) el mismo instante cae en otro día local', () => {
    // 20:00 UTC del 3 = 05:00 del 4 en Tokio, pero 15:00 del 3 en Bogotá.
    const records = [rec('2026-11-03T20:00:00.000Z'), rec('2026-11-02T20:00:00.000Z')];
    // En Tokio "hoy" (NOW) ya es el 5: días 3 y 4 → cuenta desde ayer (4).
    expect(globalStreak(records, NOW, TOKYO)).toBe(2);
    // En Bogotá hoy es el 4: días 2 y 3 → también desde ayer.
    expect(globalStreak(records, NOW, BOGOTA)).toBe(2);
    // 16:00 UTC del 4 = 01:00 del 5 en Tokio: ya es "hoy" allí.
    expect(globalStreak([rec('2026-11-04T16:00:00.000Z')], NOW, TOKYO)).toBe(1);
  });

  it('respeta cambios de horario: el desfase se pide para cada instante', () => {
    const change = Date.parse('2026-11-03T05:00:00.000Z');
    const withDst: UtcOffsetMinutes = (epochMs) => (epochMs < change ? -240 : -300);
    // 03:30 UTC del 3 con −240 es 23:30 del 2.
    expect(globalStreak([rec('2026-11-03T03:30:00.000Z'), rec(nov(4))], NOW, withDst)).toBe(1);
    expect(globalStreak([rec('2026-11-03T03:30:00.000Z'), rec(nov(3)), rec(nov(4))], NOW, withDst)).toBe(3);
  });

  it('es determinista: solo depende de now y offsetOf', () => {
    const records = [rec(nov(3)), rec(nov(2))];
    expect(globalStreak(records, new Date('2026-11-03T15:00:00.000Z'), BOGOTA)).toBe(2);
    expect(globalStreak(records, new Date('2026-11-05T15:00:00.000Z'), BOGOTA)).toBe(0);
    expect(globalStreak(records, NOW, BOGOTA)).toBe(globalStreak([...records].reverse(), NOW, BOGOTA));
  });
});

describe('bestStreak', () => {
  it('encuentra el tramo más largo aunque no sea el actual', () => {
    const records = [rec(nov(1)), rec(nov(2)), rec(nov(3)), rec('2026-10-20T12:00:00.000Z'), rec(nov(4, '13:00'), 'partial')];
    expect(bestStreak(records, BOGOTA)).toBe(3);
    expect(bestStreak([rec(nov(1)), rec(nov(3)), rec(nov(4)), rec(nov(5)), rec(nov(6))], BOGOTA)).toBe(4);
  });

  it('varios registros el mismo día cuentan una vez; sin completas, 0', () => {
    expect(bestStreak([rec(nov(1)), rec(nov(1, '13:00')), rec(nov(1, '14:00'))], BOGOTA)).toBe(1);
    expect(bestStreak([rec(nov(1), 'partial'), rec(nov(2), 'skipped')], BOGOTA)).toBe(0);
    expect(bestStreak([], BOGOTA)).toBe(0);
  });

  it('cruza meses y depende de la zona horaria', () => {
    expect(bestStreak([rec('2026-10-31T12:00:00.000Z'), rec(nov(1))], BOGOTA)).toBe(2);
    // 03:00 UTC del 2: en Bogotá es el 1 (repite día), en Tokio el 2 (alarga la racha).
    const records = [rec(nov(1, '08:00')), rec('2026-11-02T03:00:00.000Z')];
    expect(bestStreak(records, BOGOTA)).toBe(1);
    expect(bestStreak(records, TOKYO)).toBe(2);
    expect(bestStreak([rec('2026-11-01T03:00:00.000Z'), rec('2026-11-01T16:00:00.000Z')], TOKYO)).toBe(2);
  });

  it('nunca es menor que la racha actual', () => {
    const records = [rec(nov(2)), rec(nov(3)), rec(nov(4))];
    expect(bestStreak(records, BOGOTA)).toBeGreaterThanOrEqual(globalStreak(records, NOW, BOGOTA));
  });
});

const oct = (day: number, time = '12:00') => `2026-10-${String(day).padStart(2, '0')}T${time}:00.000Z`;

describe('completionRate', () => {
  it('sin datos devuelve null (nunca divide por 0)', () => {
    expect(completionRate([], { days: 7 }, NOW, BOGOTA)).toEqual({
      completed: 0,
      partial: 0,
      skipped: 0,
      noResponse: 0,
      total: 0,
      rate: null,
    });
    // Registros solo fuera del rango o con resultado desconocido: tampoco hay datos.
    expect(completionRate([rec(oct(1)), rec(nov(4), 'otro')], { days: 7 }, NOW, BOGOTA).rate).toBeNull();
    expect(completionRate([rec(nov(4))], { days: 0 }, NOW, BOGOTA).rate).toBeNull();
  });

  it('completadas / (completadas + parciales + omitidas + sin respuesta)', () => {
    const records = [rec(nov(4)), rec(nov(3)), rec(nov(2), 'partial'), rec(nov(1), 'skipped'), rec(oct(31), 'no_response')];
    expect(completionRate(records, { days: 7 }, NOW, BOGOTA)).toEqual({
      completed: 2,
      partial: 1,
      skipped: 1,
      noResponse: 1,
      total: 5,
      rate: 0.4,
    });
  });

  it('solo parciales: 0 % y el conteo aparte', () => {
    const result = completionRate([rec(nov(4), 'partial'), rec(nov(3), 'partial')], { days: 7 }, NOW, BOGOTA);
    expect(result.rate).toBe(0);
    expect(result.partial).toBe(2);
  });

  it('el rango son los últimos N días locales, incluido hoy; lo posterior a hoy queda fuera', () => {
    // 7 días: del 29 de octubre al 4 de noviembre.
    const records = [rec(oct(28)), rec(oct(29), 'partial'), rec(nov(4)), rec(nov(5))];
    expect(completionRate(records, { days: 7 }, NOW, BOGOTA)).toMatchObject({ completed: 1, partial: 1, total: 2, rate: 0.5 });
    expect(completionRate(records, { days: 30 }, NOW, BOGOTA)).toMatchObject({ completed: 2, total: 3 });
    expect(completionRate(records, { days: 1 }, NOW, BOGOTA)).toMatchObject({ completed: 1, total: 1, rate: 1 });
  });

  it('los bordes del rango siguen la medianoche local', () => {
    // 00:30 del 29 de octubre en Bogotá (05:30 UTC) entra; 23:30 del 28 (04:30 UTC del 29) no.
    const records = [rec('2026-10-29T05:30:00.000Z'), rec('2026-10-29T04:30:00.000Z', 'partial')];
    expect(completionRate(records, { days: 7 }, NOW, BOGOTA)).toMatchObject({ completed: 1, partial: 0, rate: 1 });
    // En Tokio hoy ya es el 5: el rango va del 30 de octubre al 5 de noviembre.
    expect(completionRate([rec(oct(29)), rec(nov(5, '01:00'))], { days: 7 }, NOW, TOKYO)).toMatchObject({ total: 1 });
  });
});

describe('weeklySeries', () => {
  it('7 días de lunes a domingo de la semana en curso, con hoy y futuro marcados', () => {
    const series = weeklySeries([], NOW, BOGOTA);
    expect(series.map((day) => day.date)).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
    expect(series.map((day) => day.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(series.map((day) => day.isToday)).toEqual([false, false, true, false, false, false, false]);
    expect(series.map((day) => day.isFuture)).toEqual([false, false, false, true, true, true, true]);
    expect(series.every((day) => day.total === 0)).toBe(true);
  });

  it('cuenta cada resultado por día e ignora lo de fuera de la semana', () => {
    const records = [
      rec(nov(2)),
      rec(nov(2, '13:00'), 'partial'),
      rec(nov(3), 'skipped'),
      rec(nov(4), 'no_response'),
      rec(nov(4, '13:00')),
      rec(nov(4, '14:00'), 'raro'),
      rec(nov(1)), // domingo de la semana anterior
      rec(nov(9)), // lunes de la siguiente
    ];
    const [monday, tuesday, wednesday, thursday] = weeklySeries(records, NOW, BOGOTA);
    expect(monday).toMatchObject({ completed: 1, partial: 1, skipped: 0, noResponse: 0, total: 2 });
    expect(tuesday).toMatchObject({ completed: 0, skipped: 1, total: 1 });
    expect(wednesday).toMatchObject({ completed: 1, noResponse: 1, total: 2 });
    expect(thursday.total).toBe(0);
    expect(weeklySeries(records, NOW, BOGOTA).reduce((sum, day) => sum + day.total, 0)).toBe(5);
  });

  it('el lunes la semana arranca de cero y el domingo es el último día', () => {
    const mondayMorning = new Date('2026-11-02T13:00:00.000Z'); // 08:00 del lunes en Bogotá
    const series = weeklySeries([rec(nov(1)), rec(nov(2))], mondayMorning, BOGOTA);
    expect(series[0]).toMatchObject({ date: '2026-11-02', isToday: true, completed: 1 });
    expect(series.slice(1).every((day) => day.isFuture)).toBe(true);

    const sundayNight = new Date('2026-11-09T04:30:00.000Z'); // 23:30 del domingo 8 en Bogotá
    const sunday = weeklySeries([rec('2026-11-09T04:00:00.000Z')], sundayNight, BOGOTA);
    expect(sunday[0].date).toBe('2026-11-02');
    expect(sunday[6]).toMatchObject({ date: '2026-11-08', isToday: true, completed: 1 });
    expect(sunday.some((day) => day.isFuture)).toBe(false);
  });

  it('la semana y los días dependen de la zona horaria', () => {
    // 16:00 UTC del domingo 1: en Bogotá es domingo (semana anterior); en Tokio, 01:00 del lunes 2.
    const records = [rec('2026-11-01T16:00:00.000Z')];
    expect(weeklySeries(records, NOW, BOGOTA)[0].total).toBe(0);
    const tokyo = weeklySeries(records, NOW, TOKYO);
    expect(tokyo[0]).toMatchObject({ date: '2026-11-02', completed: 1 });
    expect(tokyo[3].isToday).toBe(true); // en Tokio NOW ya es el jueves 5
  });

  it('es determinista con now inyectado', () => {
    const records = [rec(nov(3)), rec(nov(4), 'partial')];
    expect(weeklySeries(records, NOW, BOGOTA)).toEqual(weeklySeries([...records].reverse(), NOW, BOGOTA));
    expect(weeklySeries(records, new Date('2026-11-10T15:00:00.000Z'), BOGOTA).every((day) => day.total === 0)).toBe(true);
  });
});

describe('departureSummary', () => {
  const ids = departureRoutineIdsOf([
    { id: 'out', kind: 'departure' },
    { id: 'gym', kind: 'departure' },
    { id: 'home', kind: 'arrival' },
  ]);

  it('reúne racha, mejor racha, cumplimiento 7/30 días, totales y semana solo con salidas', () => {
    const records = [
      rec(nov(4)),
      rec(nov(3), 'completed', 'gym'),
      rec(nov(2), 'partial'),
      rec(oct(20)),
      rec(oct(21)),
      rec(oct(22)),
      rec(oct(23)),
      rec(nov(1), 'completed', 'home'), // llegada: fuera
      rec(nov(2), 'completed', 'home'), // llegada: no tapa el hueco del 2
      rec(nov(4), 'skipped', 'deleted'), // rutina borrada: fuera
    ];
    const summary = departureSummary(records, ids, NOW, BOGOTA);
    expect(summary.currentStreak).toBe(2);
    expect(summary.bestStreak).toBe(4);
    expect(summary.last7Days).toMatchObject({ completed: 2, partial: 1, total: 3 });
    expect(summary.last7Days.rate).toBeCloseTo(2 / 3);
    expect(summary.last30Days).toMatchObject({ completed: 6, total: 7 });
    expect(summary.totalDepartures).toBe(6);
    expect(summary.totalRecords).toBe(7);
    expect(summary.week.map((day) => day.total)).toEqual([1, 1, 1, 0, 0, 0, 0]);
  });

  it('sin salidas: ceros, tasas null y semana vacía', () => {
    const summary = departureSummary([rec(nov(4), 'completed', 'home')], ids, NOW, BOGOTA);
    expect(summary).toMatchObject({ currentStreak: 0, bestStreak: 0, totalDepartures: 0, totalRecords: 0 });
    expect(summary.last7Days.rate).toBeNull();
    expect(summary.last30Days.rate).toBeNull();
    expect(summary.week).toHaveLength(7);
  });
});
