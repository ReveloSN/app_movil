import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { bogotaDayNumber, routineStreak } from './history.streak';

const rec = (date: string, result = 'completed', routineId = 'r1'): VerificationRecord => ({
  id: `${routineId}-${date}-${result}`,
  routineId,
  date,
  result,
  itemsChecked: null,
  durationSeconds: 10,
});

// 17 de octubre de 2026, 10:00 en Bogotá (15:00 UTC).
const NOW = new Date('2026-10-17T15:00:00.000Z');

describe('racha (P08-4, America/Bogota)', () => {
  it('cuenta días seguidos con al menos una completa, terminando hoy', () => {
    const records = [rec('2026-10-17T12:00:00.000Z'), rec('2026-10-16T12:00:00.000Z'), rec('2026-10-15T12:00:00.000Z')];
    expect(routineStreak(records, 'r1', NOW)).toBe(3);
  });

  it('si hoy aún no hay, cuenta desde ayer (la racha no se pierde a media mañana)', () => {
    expect(routineStreak([rec('2026-10-16T12:00:00.000Z'), rec('2026-10-15T12:00:00.000Z')], 'r1', NOW)).toBe(2);
  });

  it('un día sin completa corta la racha; antes de ayer ya no hay racha', () => {
    expect(routineStreak([rec('2026-10-17T12:00:00.000Z'), rec('2026-10-15T12:00:00.000Z')], 'r1', NOW)).toBe(1);
    expect(routineStreak([rec('2026-10-14T12:00:00.000Z')], 'r1', NOW)).toBe(0);
  });

  it('solo cuentan las completas de esa rutina, y varias el mismo día valen uno', () => {
    const records = [
      rec('2026-10-17T12:00:00.000Z'),
      rec('2026-10-17T13:00:00.000Z'),
      rec('2026-10-16T12:00:00.000Z', 'partial'),
      rec('2026-10-16T12:00:00.000Z', 'completed', 'r2'),
    ];
    expect(routineStreak(records, 'r1', NOW)).toBe(1);
  });

  it('el día lo define la fecha en Bogotá, no en UTC', () => {
    // 23:30 del 16 en Bogotá = 04:30 UTC del 17.
    expect(bogotaDayNumber(Date.parse('2026-10-17T04:30:00.000Z'))).toBe(bogotaDayNumber(Date.parse('2026-10-16T12:00:00.000Z')));
    const records = [rec('2026-10-17T04:30:00.000Z'), rec('2026-10-17T12:00:00.000Z')];
    expect(routineStreak(records, 'r1', NOW)).toBe(2);
  });
});
