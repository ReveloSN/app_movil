import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import { firstMissingPermission } from '@/features/permissions/permission.service';
import type { PermissionKind } from '@/features/permissions/permission.types';
import type { PresetTemplate } from '@/features/routine-templates/routine-templates.types';
import { useRoutines } from '@/features/routines/useRoutines';
import { strategyFor } from '@/features/triggers/strategies';
import { useTriggerDrafts } from '@/features/triggers/TriggerDraftsProvider';

import { markOnboardingFinished } from './onboardingFlag.store';

export type OnboardingStep = 1 | 2 | 3 | 4;

/**
 * Orquesta P01 sobre lo que ya existe: plantillas (P10), creación de rutina (la misma de P04,
 * con su validación y servicio) y P06 para el aviso. Solo se elige una plantilla: es para arrancar rápido.
 */
export function useOnboardingFlow() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { createRoutine } = useRoutines();
  const { rearm } = useTriggerRuntime();
  const [formId] = useState(() => Crypto.randomUUID());
  const { drafts, suggestion, suggest, clear } = useTriggerDrafts(formId);

  const [step, setStep] = useState<OnboardingStep>(1);
  const [template, setTemplate] = useState<PresetTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Frases de los avisos con que se creó la rutina (para el paso 4). */
  const [createdPhrases, setCreatedPhrases] = useState<string[]>([]);

  useEffect(() => clear, [clear]);

  const finishOnboarding = useCallback(async () => {
    if (userId) await markOnboardingFinished(userId).catch(() => undefined);
  }, [userId]);

  function chooseTemplate(chosen: PresetTemplate) {
    clear(); // Cambiar de plantilla descarta el aviso de la anterior.
    setTemplate(chosen);
    if (chosen.suggestedTriggerDraft) suggest({ ...chosen.suggestedTriggerDraft, key: Crypto.randomUUID() });
    setError(null);
    setStep(3);
  }

  /** P06 precargado con el aviso ya configurado o, si no hay, con el sugerido por la plantilla. */
  function configureTrigger() {
    const key = drafts[0]?.key ?? suggestion?.key;
    router.push({ pathname: '/routine/trigger', params: key ? { formId, key } : { formId } });
  }

  /** Crea la rutina con o sin aviso (sin aviso si no se configuró ninguno). */
  async function createChosenRoutine() {
    if (!template || creating) return;
    setCreating(true);
    setError(null);
    const result = await createRoutine({
      name: template.name,
      icon: template.icon,
      items: [...template.items],
      triggers: [...drafts],
    });
    setCreating(false);
    if (result.status !== 'saved') {
      setError(result.status === 'failed' ? result.error : 'Revisa la rutina elegida.');
      return;
    }
    await finishOnboarding();
    setCreatedPhrases(drafts.map((draft) => strategyFor(draft).describe(draft)));
    if (drafts.length > 0) rearm().catch(() => undefined);
    setStep(4);
  }

  /** Al terminar: si a un aviso le falta un permiso, P02 queda encima de Inicio (al volver, se ve Inicio). */
  async function goToRoutines() {
    if (leaving) return;
    setLeaving(true);
    const needed = new Set<PermissionKind>();
    for (const draft of drafts) {
      needed.add('notifications');
      if (strategyFor(draft).needsLocation) needed.add('location');
    }
    const missing = needed.size > 0 ? await firstMissingPermission([...needed]).catch(() => null) : null;
    router.replace('/(tabs)');
    if (missing) router.push({ pathname: '/routine/permissions', params: { kind: missing } });
  }

  /** 01-6: sin crear nada, a Inicio con su estado vacío (EV-01). */
  async function skip() {
    await finishOnboarding();
    router.replace('/(tabs)');
  }

  const back = useCallback(
    () => setStep((current) => (current > 1 && current < 4 ? ((current - 1) as OnboardingStep) : current)),
    [],
  );

  return {
    step,
    setStep,
    back,
    formId,
    template,
    drafts,
    suggestion,
    chooseTemplate,
    configureTrigger,
    createChosenRoutine,
    creating,
    leaving,
    error,
    createdPhrases,
    goToRoutines,
    skip,
  };
}
