import { useCallback, useEffect, useState } from 'react';

import { useAiPrefs } from '@/features/ai/ai.prefs';
import { requestPatternInsight } from '@/features/ai/ai.service';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/features/feedback/toast.context';
import { useLocalRepositories } from '@/features/local-data/LocalRepositoriesProvider';
import { useRoutines } from '@/features/routines/useRoutines';
import { hapticToggleOn } from '@/shared/haptics/haptics';
import { useNetworkStatus } from '@/shared/network/useNetworkStatus';

import * as copy from './insights.copy';
import { detectPatterns, itemKey, patternKey, type OmissionPattern } from './insights.detect';
import { createSnoozeStore } from './insights.stores';

interface InsightState {
  pattern: OmissionPattern;
  message: string;
}

/**
 * Sugerencia de "aprender de tus olvidos" para una rutina: el patrón más repetido de un ítem que aún no es
 * crítico y que la persona no pospuso esta semana. El mensaje es determinista; si la IA está activa,
 * aceptada y hay conexión, se intenta redactar con ella (si falla, queda el determinista).
 */
export function useRoutineInsight(routineId: string) {
  const local = useLocalRepositories();
  const { user } = useAuth();
  const { routines } = useRoutines();
  const ai = useAiPrefs();
  const { isConnected } = useNetworkStatus();
  const toast = useToast();
  const [insight, setInsight] = useState<InsightState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const routineName = routines.find((routine) => routine.id === routineId)?.name ?? '';
  const canUseAi = ai.enabled && ai.consented && isConnected;

  useEffect(() => {
    if (!userId || !routineId) return;
    let active = true;
    const snooze = createSnoozeStore(userId);
    (async () => {
      const now = Date.now();
      const records = await local.records.getAll();
      const candidates = detectPatterns(records, new Date(now)).filter((pattern) => pattern.routineId === routineId && !pattern.critical);
      for (const pattern of candidates) {
        if (await snooze.isSnoozed(patternKey(pattern), now)) continue;
        if (!active) return;
        setInsight({ pattern, message: copy.patternMessage(pattern) });
        if (!canUseAi || !routineName) return;
        const aiInsight = await requestPatternInsight({
          item: pattern.label,
          routine: routineName,
          weekday: pattern.kind === 'weekday' ? pattern.weekday : null,
          misses: pattern.misses,
          observations: pattern.observations,
          critical: pattern.critical,
        }).catch((cause: unknown) => {
          // La sugerencia no depende de la IA: se queda el mensaje determinista.
          if (__DEV__) console.warn('[insights.ai]', cause);
          return null;
        });
        // Solo se usa si propone lo mismo que el botón (marcar como crítico).
        if (active && aiInsight?.action === 'mark_critical') {
          setInsight((current) => (current && patternKey(current.pattern) === patternKey(pattern) ? { ...current, message: aiInsight.message } : current));
        }
        return;
      }
    })().catch((cause: unknown) => {
      if (__DEV__) console.warn('[insights.detect]', cause);
    });
    return () => {
      active = false;
    };
  }, [local, userId, routineId, routineName, canUseAi]);

  const accept = useCallback(async () => {
    if (!insight) return;
    setBusy(true);
    setError(null);
    try {
      const items = await local.items.getByRoutine(insight.pattern.routineId);
      const target = items.find((item) => itemKey(item.label) === itemKey(insight.pattern.label));
      if (target) await local.items.update(target.id, { critical: true });
      hapticToggleOn();
      toast.show(copy.insightMarked(insight.pattern.label));
      setInsight(null);
    } catch (cause) {
      if (__DEV__) console.warn('[insights.accept]', cause);
      setError(copy.INSIGHT_ERROR);
    } finally {
      setBusy(false);
    }
  }, [insight, local, toast]);

  const dismiss = useCallback(async () => {
    if (!insight || !userId) return;
    setInsight(null);
    await createSnoozeStore(userId)
      .snooze(patternKey(insight.pattern), Date.now())
      .catch((cause: unknown) => {
        if (__DEV__) console.warn('[insights.snooze]', cause);
      });
  }, [insight, userId]);

  return { message: insight?.message ?? null, busy, error, accept, dismiss };
}
