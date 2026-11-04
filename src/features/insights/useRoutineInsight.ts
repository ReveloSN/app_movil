import { useCallback, useEffect, useRef, useState } from 'react';

import { useAiPrefs } from '@/features/ai/ai.prefs';
import { requestPatternInsight } from '@/features/ai/ai.service';
import type { InsightPatternInput } from '@/features/ai/ai.stats';
import { useAuth } from '@/features/auth/AuthProvider';
import { departureRecords, departureRoutineIdsOf } from '@/features/history/stats';
import { useToast } from '@/features/feedback/toast.context';
import { useLocalRepositories, useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import { ITEM_LABEL_MAX_LENGTH, MAX_ITEMS } from '@/features/routines/routine.validation';
import { useRoutines } from '@/features/routines/useRoutines';
import { hapticToggleOn } from '@/shared/haptics/haptics';
import { useNetworkStatus } from '@/shared/network/useNetworkStatus';
import type { Item } from '@/shared/types/item.types';

import { ensureForgotMigrated } from './forgot.migrate';
import * as copy from './insights.copy';
import { detectForgotPatterns, detectPatterns, itemKey, patternKey, type InsightPattern } from './insights.detect';
import { createSnoozeStore } from './insights.stores';

/** Lo que propone la tarjeta: marcar el ítem que ya está o agregar el que falta. */
export type InsightAction = 'mark_critical' | 'add_item';

interface Candidate {
  pattern: InsightPattern;
  action: InsightAction;
  /** Para la IA: si el ítem está en la rutina y si ya es crítico. */
  inRoutine: boolean;
  critical: boolean;
}

interface InsightState extends Candidate {
  message: string;
}

/** Lo que viaja a la IA: solo conteos y etiquetas, nunca el historial. */
function aiInputOf({ pattern, inRoutine, critical }: Candidate, routine: string): InsightPatternInput {
  if (pattern.kind === 'forgot_weekday') {
    const { label, weekday, misses, observations } = pattern;
    return { source: 'forgot', label, routine, weekday, misses, observations, inRoutine, critical };
  }
  return {
    item: pattern.label,
    routine,
    weekday: pattern.kind === 'weekday' ? pattern.weekday : null,
    misses: pattern.misses,
    observations: pattern.observations,
    critical: pattern.critical,
  };
}

/**
 * Qué se puede proponer en esta rutina, en orden: primero lo anotado con "Olvidé algo" (la persona lo dijo),
 * luego lo omitido al verificar. Un olvido de un ítem que ya está y ya es crítico no tiene nada que proponer.
 */
function candidatesFor(patterns: { forgot: InsightPattern[]; omissions: InsightPattern[] }, items: readonly Item[]): Candidate[] {
  const byKey = new Map(items.map((item) => [itemKey(item.label), item]));
  const forgot = patterns.forgot.flatMap((pattern): Candidate[] => {
    const item = byKey.get(itemKey(pattern.label));
    if (!item) return [{ pattern, action: 'add_item', inRoutine: false, critical: false }];
    return item.critical ? [] : [{ pattern, action: 'mark_critical', inRoutine: true, critical: false }];
  });
  const omissions = patterns.omissions.flatMap((pattern): Candidate[] =>
    pattern.kind !== 'forgot_weekday' && !pattern.critical ? [{ pattern, action: 'mark_critical', inRoutine: true, critical: false }] : [],
  );
  return [...forgot, ...omissions];
}

/**
 * Sugerencia de "aprender de tus olvidos" para una rutina: el patrón más repetido (de "Olvidé algo" o de
 * ítems omitidos) que la persona no pospuso esta semana. La detección es local y determinista, y el mensaje
 * determinista sale siempre (sin red, sin consentimiento, sin cuota o si la IA falla). Si la IA está activa,
 * aceptada y hay conexión, se le pide que lo redacte: como mucho UNA llamada por apertura de la pantalla, y
 * ninguna si ese patrón y su tramo de omisiones ya están en caché.
 */
export function useRoutineInsight(routineId: string) {
  const local = useLocalRepositories();
  const store = useLocalStore();
  const { user } = useAuth();
  const { routines } = useRoutines();
  const { rearm } = useTriggerRuntime();
  const ai = useAiPrefs();
  const { isConnected } = useNetworkStatus();
  const toast = useToast();
  const [insight, setInsight] = useState<InsightState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Rutina para la que ya se intentó la IA en esta apertura (el efecto puede repetirse al volver la red). */
  const aiAskedFor = useRef<string | null>(null);
  const userId = user?.id ?? null;
  const routineName = routines.find((routine) => routine.id === routineId)?.name ?? '';
  const canUseAi = ai.enabled && ai.consented && isConnected;

  useEffect(() => {
    if (!userId || !routineId) return;
    let active = true;
    const snooze = createSnoozeStore(userId);
    (async () => {
      const now = new Date();
      await ensureForgotMigrated(userId, store);
      const [records, events, allRoutines, items] = await Promise.all([
        local.records.getAll(),
        local.forgotEvents.getByRoutine(routineId),
        local.routines.getAll(),
        local.items.getByRoutine(routineId),
      ]);
      const routineIds = new Set(allRoutines.map((routine) => routine.id));
      const ofRoutine = (pattern: InsightPattern) => pattern.routineId === routineId;
      const candidates = candidatesFor(
        {
          forgot: detectForgotPatterns(events, records, now, undefined, routineIds).filter(ofRoutine),
          // Las rutinas de llegada no forman patrones de omisión.
          omissions: detectPatterns(departureRecords(records, departureRoutineIdsOf(allRoutines)), now).filter(ofRoutine),
        },
        items,
      );
      for (const candidate of candidates) {
        const key = patternKey(candidate.pattern);
        if (await snooze.isSnoozed(key, now.getTime())) continue;
        if (!active) return;
        setInsight({ ...candidate, message: copy.patternMessage(candidate.pattern, candidate.action) });
        if (!canUseAi || !routineName || aiAskedFor.current === routineId) return;
        aiAskedFor.current = routineId;
        const aiInsight = await requestPatternInsight(aiInputOf(candidate, routineName), key, userId).catch((cause: unknown) => {
          // Sin cuota (429), sin red o respuesta inválida: se queda el mensaje determinista.
          if (__DEV__) console.warn('[insights.ai]', cause);
          return null;
        });
        // Solo se usa si propone lo mismo que el botón.
        if (active && aiInsight?.action === candidate.action) {
          setInsight((current) => (current && patternKey(current.pattern) === key ? { ...current, message: aiInsight.message } : current));
        }
        return;
      }
    })().catch((cause: unknown) => {
      if (__DEV__) console.warn('[insights.detect]', cause);
    });
    return () => {
      active = false;
    };
  }, [local, store, userId, routineId, routineName, canUseAi]);

  const accept = useCallback(async () => {
    if (!insight) return;
    const { pattern, action } = insight;
    setBusy(true);
    setError(null);
    try {
      const items = await local.items.getByRoutine(pattern.routineId);
      const target = items.find((item) => itemKey(item.label) === itemKey(pattern.label));
      if (action === 'mark_critical' || target) {
        if (target && !target.critical) await local.items.update(target.id, { critical: true });
        hapticToggleOn();
        toast.show(action === 'mark_critical' ? copy.insightMarked(pattern.label) : copy.forgotAlreadyInRoutine(pattern.label));
        setInsight(null);
        return;
      }
      if (items.length >= MAX_ITEMS) {
        // Como en "Olvidé algo": con la rutina llena se avisa y no se añade.
        setError(copy.INSIGHT_FULL);
        return;
      }
      const label = pattern.label.slice(0, ITEM_LABEL_MAX_LENGTH).trim();
      await local.items.create({ routineId: pattern.routineId, label, type: 'carry', critical: false, sortOrder: items.length });
      hapticToggleOn();
      toast.show(copy.forgotAdded(label));
      setInsight(null);
      // El cuerpo de las notificaciones lista los ítems: se reprograma con el nuevo.
      rearm().catch((cause: unknown) => {
        if (__DEV__) console.warn('[insights.accept.rearm]', cause);
      });
    } catch (cause) {
      if (__DEV__) console.warn('[insights.accept]', cause);
      setError(copy.INSIGHT_ERROR);
    } finally {
      setBusy(false);
    }
  }, [insight, local, toast, rearm]);

  const dismiss = useCallback(async () => {
    if (!insight || !userId) return;
    setInsight(null);
    setError(null);
    await createSnoozeStore(userId)
      .snooze(patternKey(insight.pattern), Date.now())
      .catch((cause: unknown) => {
        if (__DEV__) console.warn('[insights.snooze]', cause);
      });
  }, [insight, userId]);

  return {
    message: insight?.message ?? null,
    acceptLabel: insight?.action === 'add_item' ? copy.INSIGHT_ADD : copy.INSIGHT_ACCEPT,
    busy,
    error,
    accept,
    dismiss,
  };
}
