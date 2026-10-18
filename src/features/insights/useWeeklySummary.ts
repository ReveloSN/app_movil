import { useCallback, useEffect, useMemo, useState } from 'react';

import { aiErrorMessage } from '@/features/ai/ai.copy';
import { requestWeekSummary } from '@/features/ai/ai.service';
import { AiClientError } from '@/features/ai/ai.types';
import { useAiAccess } from '@/features/ai/useAiAccess';
import { useAuth } from '@/features/auth/AuthProvider';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { buildWeeklyStats, deterministicSummary, isEmptyWeek, weekKey } from './weekly';
import { createWeeklySummaryStore, type StoredWeekSummary } from './weekly.store';

export const WEEKLY_FALLBACK_NOTE = 'Te mostramos el resumen automático.';

/**
 * "Tu semana": estadísticas de la semana y su resumen guardado. Generarlo lo inicia la persona (controla
 * la cuota): con la IA activa y conexión lo redacta la IA; si no, o si la IA falla, el resumen automático.
 */
export function useWeeklySummary(records: readonly VerificationRecord[], now: Date) {
  const { user } = useAuth();
  const ai = useAiAccess();
  const userId = user?.id ?? null;
  const week = weekKey(now);
  const stats = useMemo(() => buildWeeklyStats(records, now), [records, now]);
  const [summary, setSummary] = useState<StoredWeekSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    createWeeklySummaryStore(userId)
      .get(week)
      .then(
        (stored) => {
          if (active) setSummary(stored);
        },
        (cause: unknown) => {
          if (__DEV__) console.warn('[weekly.load]', cause);
        },
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, week]);

  const save = useCallback(
    async (text: { resumen: string; recomendacion: string }, source: StoredWeekSummary['source']) => {
      const entry: StoredWeekSummary = { ...text, source, createdAt: new Date().toISOString() };
      setSummary(entry);
      if (userId) {
        await createWeeklySummaryStore(userId)
          .set(week, entry)
          .catch((cause: unknown) => {
            if (__DEV__) console.warn('[weekly.save]', cause);
          });
      }
    },
    [userId, week],
  );

  const generateWithAi = useCallback(async () => {
    setGenerating(true);
    setNotice(null);
    try {
      await save(await requestWeekSummary(stats), 'ai');
    } catch (cause) {
      // La tarjeta nunca queda vacía por la IA: se explica qué pasó y se muestra el automático.
      const kind = cause instanceof AiClientError ? cause.kind : 'server';
      setNotice(`${aiErrorMessage(kind)} ${WEEKLY_FALLBACK_NOTE}`);
      await save(deterministicSummary(stats), 'local');
    } finally {
      setGenerating(false);
    }
  }, [save, stats]);

  const generate = useCallback(() => {
    if (ai.visible && ai.online) ai.whenConsented(() => void generateWithAi());
    else void save(deterministicSummary(stats), 'local');
  }, [ai, generateWithAi, save, stats]);

  return {
    stats,
    empty: isEmptyWeek(stats),
    summary,
    loading,
    generating,
    notice,
    generate,
    /** Aviso de privacidad de la IA (primer uso o versión nueva). */
    consent: ai.consent,
  };
}
