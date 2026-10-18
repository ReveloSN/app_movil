import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { detectPatterns, patternKey } from './insights.detect';

// Sábado 17 de octubre de 2026, 20:00 (hora local).
const NOW = new Date(2026, 9, 17, 20, 0);
const daysAgo = (days: number, hour = 7) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

let seq = 0;
const record = (date: string, items: { label: string; checked: boolean; critical?: boolean }[], routineId = 'r1'): VerificationRecord => ({
  id: `rec-${++seq}`,
  routineId,
  date,
  result: items.every((item) => item.checked) ? 'completed' : 'partial',
  itemsChecked: items.map((item) => ({ label: item.label, critical: item.critical ?? false, checked: item.checked })),
  durationSeconds: 10,
});

const keysOk = { label: 'Llaves', checked: true, critical: true };
const charger = (checked: boolean) => ({ label: 'Cargador', checked });

describe('detectPatterns', () => {
  it('sin historial no hay patrones', () => {
    expect(detectPatterns([], NOW)).toEqual([]);
  });

  it('ítem omitido 3 veces en los últimos 14 días → patrón', () => {
    const records = [1, 4, 9].map((d) => record(daysAgo(d), [keysOk, charger(false)]));
    const [pattern] = detectPatterns(records, NOW);
    expect(pattern).toMatchObject({ kind: 'item', routineId: 'r1', label: 'Cargador', recentMisses: 3, misses: 3, observations: 3 });
  });

  it('dos omisiones recientes no bastan (y el resto marcado no es un patrón)', () => {
    const records = [record(daysAgo(1), [charger(false)]), record(daysAgo(2), [charger(false)]), record(daysAgo(3), [charger(true)])];
    expect(detectPatterns(records, NOW)).toEqual([]);
  });

  it('omisiones antiguas: cuenta el 40 % si hay al menos 5 verificaciones', () => {
    const old = [30, 31, 32, 33, 34].map((d, i) => record(daysAgo(d), [charger(i < 2)])); // 3 de 5 omitidas
    const [pattern] = detectPatterns(old, NOW);
    expect(pattern).toMatchObject({ kind: 'item', label: 'Cargador', recentMisses: 0, misses: 3, observations: 5 });
  });

  it('el 40 % con pocas verificaciones no es un patrón (1 de 2)', () => {
    const records = [record(daysAgo(40), [charger(false)]), record(daysAgo(41), [charger(true)])];
    expect(detectPatterns(records, NOW)).toEqual([]);
  });

  it('el mismo día de la semana: ≥ 3 omisiones con ≥ 4 observaciones ese día', () => {
    // Martes: 4 martes seguidos (3 omitidos) y el resto de días, marcado.
    const tuesdays = [4, 11, 18, 25].map((d, i) => record(daysAgo(d), [charger(i === 3)]));
    const others = [1, 2, 3, 5, 6, 8, 9, 10, 12, 13].map((d) => record(daysAgo(d), [charger(true)]));
    const patterns = detectPatterns([...tuesdays, ...others], NOW);
    const weekday = patterns.find((pattern) => pattern.kind === 'weekday');
    expect(weekday).toMatchObject({ kind: 'weekday', weekday: 2, misses: 3, observations: 4 });
  });

  it('agrupa sin distinguir mayúsculas ni tildes, por rutina, y usa la etiqueta más reciente', () => {
    const records = [
      record(daysAgo(5), [{ label: 'cargador', checked: false }]),
      record(daysAgo(3), [{ label: 'CARGADOR', checked: false }]),
      record(daysAgo(1), [{ label: 'Cargador', checked: false }]),
      record(daysAgo(1), [{ label: 'Cargador', checked: false }], 'r2'),
    ];
    const patterns = detectPatterns(records, NOW);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({ routineId: 'r1', label: 'Cargador', misses: 3 });
  });

  it('ignora registros sin lista de ítems, con fecha inválida o del futuro', () => {
    const weird: VerificationRecord[] = [
      { id: 'a', routineId: 'r1', date: daysAgo(1), result: 'skipped', itemsChecked: null, durationSeconds: null },
      { id: 'b', routineId: 'r1', date: 'no-es-fecha', result: 'partial', itemsChecked: [{ label: 'Cargador', checked: false }], durationSeconds: 1 },
      { ...record(daysAgo(-2), [charger(false)]) },
    ];
    expect(detectPatterns(weird, NOW)).toEqual([]);
  });

  it('la clave del patrón es estable y distingue el día', () => {
    const records = [1, 4, 9].map((d) => record(daysAgo(d), [charger(false)]));
    const [pattern] = detectPatterns(records, NOW);
    expect(patternKey(pattern)).toBe('item|r1|cargador|');
  });
});
