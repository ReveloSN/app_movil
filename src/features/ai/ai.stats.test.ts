import { memoryStorage } from '@/db/local/testing/memoryStorage';

import { STATS_LIMITS } from '../../../supabase/functions/ai-routine/stats';
import { AI_STATS_LIMITS, hashText, requestInsight, requestWeeklySummary, toInsight, toWeeklySummary } from './ai.stats';
import { AiClientError } from './ai.types';

const PATTERN = { item: 'Cargador', routine: 'Saliendo de casa', weekday: null, misses: 3, observations: 5, critical: false };
const STATS = {
  weekStart: '2026-10-12',
  completed: 5,
  partial: 1,
  skipped: 0,
  streak: 2,
  previousCompleted: 3,
  topSkipped: [{ label: 'Cargador', count: 2 }],
  bestDay: 1,
  worstDay: null,
};

const invalid = (fn: () => unknown) => {
  try {
    fn();
  } catch (cause) {
    return cause instanceof AiClientError && cause.kind === 'invalid_output';
  }
  return false;
};

describe('IA con estadísticas (app)', () => {
  it('usa los mismos límites que el servidor', () => {
    expect(AI_STATS_LIMITS.insightMessage).toBe(STATS_LIMITS.insightMessage);
    expect(AI_STATS_LIMITS.summary).toBe(STATS_LIMITS.summary);
    expect(AI_STATS_LIMITS.recommendation).toBe(STATS_LIMITS.recommendation);
    expect(AI_STATS_LIMITS.itemLabel).toBe(STATS_LIMITS.itemLabel);
  });

  it('valida el insight: texto limpio, acción conocida o none', () => {
    expect(toInsight({ mode: 'insights', insight: { message: '  Sueles omitir «Cargador».\n', action: 'mark_critical' } })).toEqual({
      message: 'Sueles omitir «Cargador».',
      action: 'mark_critical',
    });
    expect(toInsight({ mode: 'insights', insight: { message: 'Hola', action: 'otra' } }).action).toBe('none');
  });

  it('rechaza respuestas con enlaces, vacías, demasiado largas o de otro modo', () => {
    expect(invalid(() => toInsight({ mode: 'insights', insight: { message: 'Mira www.x.com', action: 'none' } }))).toBe(true);
    expect(invalid(() => toInsight({ mode: 'insights', insight: { message: ' ', action: 'none' } }))).toBe(true);
    expect(invalid(() => toInsight({ mode: 'insights', insight: { message: 'a'.repeat(161), action: 'none' } }))).toBe(true);
    expect(invalid(() => toInsight({ mode: 'suggest', suggestions: [] }))).toBe(true);
    expect(invalid(() => toWeeklySummary({ mode: 'weekly_summary', summary: { resumen: 'Bien' } }))).toBe(true);
  });

  it('pide el insight una sola vez por patrón (caché persistente por hash)', async () => {
    const storage = memoryStorage();
    const client = jest.fn().mockResolvedValue({ mode: 'insights', insight: { message: 'Sueles omitir «Cargador».', action: 'none' } });

    const first = await requestInsight(PATTERN, { client, storage });
    const second = await requestInsight({ ...PATTERN }, { client, storage });

    expect(first).toEqual(second);
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenCalledWith({ mode: 'insights', pattern: PATTERN });
    expect(storage.data['ai-insights-cache']).toContain(hashText(JSON.stringify(PATTERN)));
  });

  it('un patrón distinto vuelve a preguntar', async () => {
    const storage = memoryStorage();
    const client = jest.fn().mockResolvedValue({ mode: 'insights', insight: { message: 'Hola', action: 'none' } });
    await requestInsight(PATTERN, { client, storage });
    await requestInsight({ ...PATTERN, misses: 4 }, { client, storage });
    expect(client).toHaveBeenCalledTimes(2);
  });

  it('el resumen semanal envía solo estadísticas y valida la respuesta', async () => {
    const client = jest.fn().mockResolvedValue({
      mode: 'weekly_summary',
      summary: { resumen: 'Completaste 5 verificaciones, 2 más que la semana pasada.', recomendacion: 'Deja el cargador junto a las llaves.' },
    });
    const summary = await requestWeeklySummary(STATS, client);
    expect(summary.recomendacion).toBe('Deja el cargador junto a las llaves.');
    expect(client).toHaveBeenCalledWith({ mode: 'weekly_summary', stats: STATS });
  });

  it('el hash es estable y corto', () => {
    expect(hashText('abc')).toBe(hashText('abc'));
    expect(hashText('abc')).toMatch(/^[0-9a-f]{8}$/);
    expect(hashText('abc')).not.toBe(hashText('abd'));
  });
});
