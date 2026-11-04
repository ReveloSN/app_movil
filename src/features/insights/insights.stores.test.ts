import { memoryStorage } from '@/db/local/testing/memoryStorage';

import { patternMessage } from './insights.copy';
import { createSnoozeStore } from './insights.stores';

const DAY = 24 * 60 * 60 * 1000;

describe('"Ahora no"', () => {
  it('no insiste con el mismo patrón durante una semana', async () => {
    const store = createSnoozeStore('u1', memoryStorage());
    await store.snooze('item|r1|cargador|', 0);
    expect(await store.isSnoozed('item|r1|cargador|', 6 * DAY)).toBe(true);
    expect(await store.isSnoozed('item|r1|cargador|', 8 * DAY)).toBe(false);
    expect(await store.isSnoozed('item|r1|llaves|', DAY)).toBe(false);
  });

  it('es por usuario y tolera un valor corrupto', async () => {
    const storage = memoryStorage({ 'insights-snooze:u1': '{roto' });
    expect(await createSnoozeStore('u1', storage).isSnoozed('x', 0)).toBe(false);
    await createSnoozeStore('u2', storage).snooze('x', 0);
    expect(await createSnoozeStore('u1', storage).isSnoozed('x', 1)).toBe(false);
  });
});

describe('mensaje determinista (sin IA)', () => {
  it('sin culpa, con el ítem entre comillas y el día si aplica', () => {
    const base = { routineId: 'r1', label: 'Cargador', misses: 3, observations: 4, critical: false };
    expect(patternMessage({ kind: 'item', recentMisses: 3, ...base })).toBe('Sueles omitir «Cargador». ¿Lo marcamos como crítico?');
    expect(patternMessage({ kind: 'weekday', weekday: 2, ...base })).toBe('Los martes sueles omitir «Cargador». ¿Lo marcamos como crítico?');
  });
});
