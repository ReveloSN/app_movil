import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { buildWeeklyStats, deterministicSummary, isEmptyWeek, mondayOf, weekKey } from './weekly';

// Jueves 15 de octubre de 2026, 20:00 (hora local): la semana empieza el lunes 12.
const NOW = new Date(2026, 9, 15, 20, 0);
const at = (month: number, day: number, hour = 7) => new Date(2026, month, day, hour).toISOString();

let seq = 0;
const record = (date: string, result: string, skipped: string[] = []): VerificationRecord => ({
  id: `r${++seq}`,
  routineId: 'r1',
  date,
  result,
  itemsChecked: [{ label: 'Llaves', critical: true, checked: true }, ...skipped.map((label) => ({ label, critical: false, checked: false }))],
  durationSeconds: 8,
});

describe('semana', () => {
  it('el lunes de la semana (también desde un domingo) y su clave', () => {
    expect(weekKey(NOW)).toBe('2026-10-12');
    expect(mondayOf(new Date(2026, 9, 18, 23)).getDate()).toBe(12);
    expect(weekKey(new Date(2026, 9, 19, 0, 5))).toBe('2026-10-19');
  });
});

describe('buildWeeklyStats', () => {
  const records = [
    record(at(9, 12), 'completed'), // lunes
    record(at(9, 13), 'completed'), // martes
    record(at(9, 14), 'partial', ['Cargador']), // miércoles
    record(at(9, 15), 'partial', ['Cargador']), // jueves
    record(at(9, 15, 9), 'skipped'),
    record(at(9, 8), 'completed'), // semana anterior
    record(at(9, 1), 'completed'), // hace dos semanas: no cuenta
  ];

  it('cuenta la semana actual y compara con la anterior', () => {
    expect(buildWeeklyStats(records, NOW)).toEqual({
      weekStart: '2026-10-12',
      completed: 2,
      partial: 2,
      skipped: 1,
      streak: 0, // la última completa fue el martes
      previousCompleted: 1,
      topSkipped: [{ label: 'Cargador', count: 2 }],
      bestDay: 1,
      worstDay: 3,
    });
  });

  it('la racha cuenta días seguidos con alguna completa hasta hoy', () => {
    const streak = [13, 14, 15].map((day) => record(at(9, day), 'completed'));
    expect(buildWeeklyStats(streak, NOW).streak).toBe(3);
  });

  it('semana sin verificaciones: vacía y sin mejor ni peor día', () => {
    const stats = buildWeeklyStats([record(at(9, 8), 'completed')], NOW);
    expect(isEmptyWeek(stats)).toBe(true);
    expect(stats.bestDay).toBeNull();
    expect(stats.worstDay).toBeNull();
  });
});

describe('deterministicSummary', () => {
  it('breve, sin culpa y con UNA recomendación sobre lo más omitido', () => {
    const summary = deterministicSummary(buildWeeklyStats([record(at(9, 12), 'completed'), record(at(9, 14), 'partial', ['Cargador'])], NOW));
    expect(summary.resumen).toBe('Esta semana verificaste 2 veces: 1 completa. Es 1 más que la semana pasada. Tu mejor día fue el lunes.');
    expect(summary.recomendacion).toBe('«Cargador» se quedó 1 vez: déjalo junto a la puerta la noche antes.');
  });

  it('respeta los límites (280 y 140)', () => {
    const summary = deterministicSummary({
      weekStart: '2026-10-12',
      completed: 400,
      partial: 3,
      skipped: 0,
      streak: 30,
      previousCompleted: 2,
      topSkipped: [{ label: 'x'.repeat(32), count: 300 }],
      bestDay: 3,
      worstDay: 1,
    });
    expect(summary.resumen.length).toBeLessThanOrEqual(280);
    expect(summary.recomendacion.length).toBeLessThanOrEqual(140);
    expect(summary.resumen).toContain('398 más que la semana pasada');
  });
});
