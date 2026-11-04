import type { VerificationRecord } from '@/shared/types/verification-record.types';

import type { UtcOffsetMinutes } from './history.streak';
import { bestStreak, departureRecords, departureRoutineIdsOf, globalStreak } from './stats';

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
