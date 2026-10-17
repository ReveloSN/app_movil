import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { localDayNumber, routineStreak, type UtcOffsetMinutes } from './history.streak';

const rec = (date: string, result = 'completed', routineId = 'r1'): VerificationRecord => ({
  id: `${routineId}-${date}-${result}`,
  routineId,
  date,
  result,
  itemsChecked: null,
  durationSeconds: 10,
});

// Desfases inyectados: los tests no dependen de la zona horaria de la máquina que los corre.
const BOGOTA: UtcOffsetMinutes = () => -300;
const MADRID: UtcOffsetMinutes = () => 120;

// 17 de octubre de 2026, 10:00 en Bogotá (15:00 UTC).
const NOW = new Date('2026-10-17T15:00:00.000Z');

describe('racha (P08-4, fecha local del teléfono)', () => {
  it('cuenta días seguidos con al menos una completa, terminando hoy', () => {
    const records = [rec('2026-10-17T12:00:00.000Z'), rec('2026-10-16T12:00:00.000Z'), rec('2026-10-15T12:00:00.000Z')];
    expect(routineStreak(records, 'r1', NOW, BOGOTA)).toBe(3);
  });

  it('si hoy aún no hay, cuenta desde ayer (la racha no se pierde a media mañana)', () => {
    expect(routineStreak([rec('2026-10-16T12:00:00.000Z'), rec('2026-10-15T12:00:00.000Z')], 'r1', NOW, BOGOTA)).toBe(2);
  });

  it('un día sin completa corta la racha; antes de ayer ya no hay racha', () => {
    expect(routineStreak([rec('2026-10-17T12:00:00.000Z'), rec('2026-10-15T12:00:00.000Z')], 'r1', NOW, BOGOTA)).toBe(1);
    expect(routineStreak([rec('2026-10-14T12:00:00.000Z')], 'r1', NOW, BOGOTA)).toBe(0);
  });

  it('solo cuentan las completas de esa rutina, y varias el mismo día valen uno', () => {
    const records = [
      rec('2026-10-17T12:00:00.000Z'),
      rec('2026-10-17T13:00:00.000Z'),
      rec('2026-10-16T12:00:00.000Z', 'partial'),
      rec('2026-10-16T12:00:00.000Z', 'completed', 'r2'),
    ];
    expect(routineStreak(records, 'r1', NOW, BOGOTA)).toBe(1);
  });

  it('el día lo define la fecha local, no la de UTC', () => {
    // 23:30 del 16 en Bogotá = 04:30 UTC del 17: cuenta como el 16.
    expect(localDayNumber(Date.parse('2026-10-17T04:30:00.000Z'), BOGOTA)).toBe(
      localDayNumber(Date.parse('2026-10-16T12:00:00.000Z'), BOGOTA),
    );
    const records = [rec('2026-10-17T04:30:00.000Z'), rec('2026-10-17T12:00:00.000Z')];
    expect(routineStreak(records, 'r1', NOW, BOGOTA)).toBe(2);
  });

  it('la misma verificación cae en otro día con otra zona del teléfono', () => {
    // 23:30 UTC del 16: en Bogotá es el 16 (18:30), en Madrid ya es el 17 (01:30).
    const late = Date.parse('2026-10-16T23:30:00.000Z');
    expect(localDayNumber(late, MADRID)).toBe(localDayNumber(late, BOGOTA) + 1);
  });

  it('respeta un cambio de horario: el desfase se pide para cada instante', () => {
    // Desfase −240 hasta el 16 inclusive y −300 desde el 17 (como un fin de horario de verano).
    const change = Date.parse('2026-10-17T05:00:00.000Z');
    const withDst: UtcOffsetMinutes = (epochMs) => (epochMs < change ? -240 : -300);
    const records = [rec('2026-10-16T03:30:00.000Z'), rec('2026-10-16T12:00:00.000Z'), rec('2026-10-17T12:00:00.000Z')];
    // 03:30 UTC del 16 con −240 es 23:30 del 15: tres días seguidos (15, 16 y 17).
    expect(routineStreak(records, 'r1', NOW, withDst)).toBe(3);
  });
});
