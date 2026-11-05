import { memoryStorage } from '@/db/local/testing/memoryStorage';

import { STATS_LIMITS } from '../../../supabase/functions/ai-routine/stats';
import {
  AI_STATS_LIMITS,
  expectedInsightAction,
  hashText,
  insightCacheKey,
  missesBucket,
  quotaDayOf,
  requestInsight,
  requestWeeklySummary,
  toInsight,
  toWeeklySummary,
  type ForgotPatternInput,
} from './ai.stats';
import { AiClientError } from './ai.types';

const PATTERN = { item: 'Cargador', routine: 'Saliendo de casa', weekday: null, misses: 3, observations: 5, critical: false };
const FORGOT: ForgotPatternInput = {
  source: 'forgot',
  label: 'Llaves',
  routine: 'Saliendo de casa',
  weekday: 1,
  misses: 3,
  observations: 4,
  inRoutine: false,
  critical: false,
};
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
    expect(toInsight({ mode: 'insights', insight: { message: 'Hola', action: 'add_item' } }).action).toBe('add_item');
  });

  it('rechaza respuestas con enlaces, vacías, demasiado largas o de otro modo', () => {
    expect(invalid(() => toInsight({ mode: 'insights', insight: { message: 'Mira www.x.com', action: 'none' } }))).toBe(true);
    expect(invalid(() => toInsight({ mode: 'insights', insight: { message: ' ', action: 'none' } }))).toBe(true);
    expect(invalid(() => toInsight({ mode: 'insights', insight: { message: 'a'.repeat(141), action: 'none' } }))).toBe(true);
    expect(invalid(() => toInsight({ mode: 'suggest', suggestions: [] }))).toBe(true);
    expect(invalid(() => toWeeklySummary({ mode: 'weekly_summary', summary: { resumen: 'Bien' } }))).toBe(true);
  });

  it('pide el insight una sola vez por patrón (caché persistente por hash)', async () => {
    const storage = memoryStorage();
    const client = jest.fn().mockResolvedValue({ mode: 'insights', insight: { message: 'Sueles omitir «Cargador».', action: 'none' } });

    const first = await requestInsight(PATTERN, { client, userId: 'u1', storage });
    const second = await requestInsight({ ...PATTERN }, { client, userId: 'u1', storage });

    expect(first).toEqual(second);
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenCalledWith({ mode: 'insights', pattern: PATTERN });
    expect(storage.data['ai-insights-cache:u1']).toContain(insightCacheKey(PATTERN));
  });

  it('un patrón distinto vuelve a preguntar', async () => {
    const storage = memoryStorage();
    const client = jest.fn().mockResolvedValue({ mode: 'insights', insight: { message: 'Hola', action: 'none' } });
    await requestInsight(PATTERN, { client, userId: 'u1', storage, patternId: 'item|r1|cargador|' });
    await requestInsight({ ...PATTERN, item: 'Llaves' }, { client, userId: 'u1', storage, patternId: 'item|r1|llaves|' });
    expect(client).toHaveBeenCalledTimes(2);
  });

  describe('caché por tramos de omisiones (3–4, 5–9, 10+)', () => {
    const ok = { mode: 'insights', insight: { message: 'Olvidas las «Llaves» los lunes. ¿Las agregamos?', action: 'add_item' } };

    it('el mismo tramo no vuelve a llamar; cambiar de tramo sí', async () => {
      const storage = memoryStorage();
      const client = jest.fn().mockResolvedValue(ok);
      const ask = (misses: number) => requestInsight({ ...FORGOT, misses, observations: 12 }, { client, userId: 'u1', storage, patternId: 'forgot_weekday|r1|llaves|1' });

      await ask(3);
      await ask(4);
      expect(client).toHaveBeenCalledTimes(1);
      await ask(5);
      await ask(9);
      expect(client).toHaveBeenCalledTimes(2);
      await ask(10);
      await ask(12);
      expect(client).toHaveBeenCalledTimes(3);
      expect([3, 4, 5, 9, 10, 40].map(missesBucket)).toEqual(['3-4', '3-4', '5-9', '5-9', '10+', '10+']);
    });

    it('la clave incluye el origen y el patrón', () => {
      const omission = { item: 'Llaves', routine: 'Saliendo de casa', weekday: 1, misses: 3, observations: 4, critical: false };
      expect(insightCacheKey(FORGOT, 'p')).not.toBe(insightCacheKey({ ...omission, source: 'omission' }, 'p'));
      expect(insightCacheKey(FORGOT, 'p')).not.toBe(insightCacheKey(FORGOT, 'q'));
      // Si el ítem ya se agregó, la acción esperada cambia y no se reutiliza el "¿Lo agregamos?".
      expect(insightCacheKey(FORGOT, 'p')).not.toBe(insightCacheKey({ ...FORGOT, inRoutine: true }, 'p'));
      expect(insightCacheKey({ ...FORGOT, misses: 3 }, 'p')).toBe(insightCacheKey({ ...FORGOT, misses: 4, observations: 9 }, 'p'));
    });

    it('envía el olvido con su origen y la etiqueta recortada a 60', async () => {
      const client = jest.fn().mockResolvedValue(ok);
      const insight = await requestInsight({ ...FORGOT, label: `  ${'x'.repeat(70)} ` }, { client, userId: 'u1', storage: memoryStorage() });
      expect(insight.action).toBe('add_item');
      const [[request]] = client.mock.calls as [[{ pattern: { source: string; label: string } }]];
      expect(request.pattern.source).toBe('forgot');
      expect(request.pattern.label).toHaveLength(AI_STATS_LIMITS.forgotLabel);
      expect(AI_STATS_LIMITS.forgotLabel).toBe(STATS_LIMITS.forgotLabel);
      expect(expectedInsightAction(FORGOT)).toBe('add_item');
      expect(expectedInsightAction({ ...FORGOT, inRoutine: true })).toBe('mark_critical');
    });

    it('tras un 429, ese día no se vuelve a llamar (ni se cachea el error)', async () => {
      const storage = memoryStorage();
      const client = jest.fn().mockRejectedValue(new AiClientError('quota_exceeded'));
      const day = Date.UTC(2026, 10, 2, 15);
      const ask = (now: number) => requestInsight(FORGOT, { client, userId: 'u1', storage, now: () => now });

      await expect(ask(day)).rejects.toMatchObject({ kind: 'quota_exceeded' });
      await expect(ask(day + 60_000)).rejects.toMatchObject({ kind: 'quota_exceeded' });
      expect(client).toHaveBeenCalledTimes(1);
      expect(storage.data['ai-insights-cache:u1']).toBeUndefined();

      client.mockResolvedValue(ok);
      await expect(ask(day + 24 * 60 * 60_000)).resolves.toMatchObject({ action: 'add_item' });
      expect(client).toHaveBeenCalledTimes(2);
    });

    it('el bloqueo por cuota y la caché son por cuenta: otra cuenta del mismo teléfono no los hereda', async () => {
      const storage = memoryStorage();
      const client = jest.fn().mockRejectedValue(new AiClientError('quota_exceeded'));
      const now = Date.UTC(2026, 10, 2, 15);
      await expect(requestInsight(FORGOT, { client, userId: 'ana', storage, now: () => now })).rejects.toMatchObject({ kind: 'quota_exceeded' });
      expect(storage.data['ai-insights-quota-day:ana']).toBeDefined();
      expect(storage.data['ai-insights-quota-day']).toBeUndefined();

      // La otra cuenta sí puede preguntar, y su caché no mezcla con la de Ana.
      client.mockResolvedValue(ok);
      await expect(requestInsight(FORGOT, { client, userId: 'beto', storage, now: () => now })).resolves.toMatchObject({ action: 'add_item' });
      expect(storage.data['ai-insights-cache:beto']).toBeDefined();
      expect(storage.data['ai-insights-cache:ana']).toBeUndefined();
      // Ana sigue bloqueada ese día.
      await expect(requestInsight(FORGOT, { client, userId: 'ana', storage, now: () => now })).rejects.toMatchObject({ kind: 'quota_exceeded' });
    });

    it('ignora la caché y el bloqueo antiguos, que eran globales entre cuentas', async () => {
      const day = Date.UTC(2026, 10, 2, 15);
      const storage = memoryStorage({
        'ai-insights-quota-day': quotaDayOf(day),
        'ai-insights-cache': JSON.stringify({ [insightCacheKey(FORGOT)]: { message: 'Viejo', action: 'add_item' } }),
      });
      const client = jest.fn().mockResolvedValue(ok);
      const insight = await requestInsight(FORGOT, { client, userId: 'u1', storage, now: () => day });
      expect(insight.message).toBe(ok.insight.message);
      expect(client).toHaveBeenCalledTimes(1);
    });

    it('el día del bloqueo es el de Bogotá (UTC-5), no el de la zona del teléfono', async () => {
      const storage = memoryStorage();
      const client = jest.fn().mockRejectedValue(new AiClientError('quota_exceeded'));
      // 04:00 UTC del 3/nov = 23:00 del 2/nov en Bogotá; 05:00 UTC ya es el 3/nov en Bogotá.
      const lateEvening = Date.UTC(2026, 10, 3, 4, 0);
      const ask = (now: number) => requestInsight(FORGOT, { client, userId: 'u1', storage, now: () => now });

      await expect(ask(lateEvening)).rejects.toMatchObject({ kind: 'quota_exceeded' });
      expect(storage.data['ai-insights-quota-day:u1']).toBe(quotaDayOf(Date.UTC(2026, 10, 2, 20)));
      await expect(ask(Date.UTC(2026, 10, 3, 4, 59))).rejects.toMatchObject({ kind: 'quota_exceeded' });
      expect(client).toHaveBeenCalledTimes(1);

      client.mockResolvedValue(ok);
      await expect(ask(Date.UTC(2026, 10, 3, 5, 0))).resolves.toMatchObject({ action: 'add_item' });
      expect(client).toHaveBeenCalledTimes(2);
    });

    it('otros errores no bloquean el día: la próxima apertura puede intentarlo', async () => {
      const storage = memoryStorage();
      const client = jest.fn().mockRejectedValueOnce(new AiClientError('offline')).mockResolvedValue(ok);
      await expect(requestInsight(FORGOT, { client, userId: 'u1', storage })).rejects.toMatchObject({ kind: 'offline' });
      await expect(requestInsight(FORGOT, { client, userId: 'u1', storage })).resolves.toMatchObject({ action: 'add_item' });
    });
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
