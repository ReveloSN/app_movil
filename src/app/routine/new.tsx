import * as Crypto from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { getAiDraft } from '@/features/ai/aiDraft.store';
import { findPresetTemplate } from '@/features/routine-templates/routine-templates.data';
import { RoutineForm } from '@/features/routines/RoutineForm';
import { useTriggerDrafts } from '@/features/triggers/TriggerDraftsProvider';

/**
 * P04 en modo crear. Con ?templateId= llega precargada desde Plantillas (P10); con ?aiDraftId=, con el
 * borrador de "Crear con IA" (nada se guarda hasta "Guardar cambios").
 */
export default function NewRoutineScreen() {
  const { templateId, aiDraftId } = useLocalSearchParams<{ templateId?: string; aiDraftId?: string }>();
  const template = findPresetTemplate(templateId);
  const [aiSeed] = useState(() => getAiDraft(aiDraftId));
  // Los avisos se editan en P06 (otra pantalla): se comparten por este id de formulario.
  const [formId] = useState(() => Crypto.randomUUID());
  const { upsert } = useTriggerDrafts(formId);

  // El aviso por horario que sugirió la IA entra como un aviso más (se puede quitar o editar en P06).
  const schedule = aiSeed?.schedule;
  useEffect(() => {
    if (schedule) upsert({ ...schedule, key: `${formId}-ai` });
  }, [schedule, upsert, formId]);

  const initialDraft = aiSeed
    ? aiSeed.draft
    : template
      ? { name: template.name, icon: template.icon, items: [...template.items] }
      : undefined;

  return (
    <RoutineForm
      formId={formId}
      initialDraft={initialDraft}
      aiAssisted={aiSeed ? { suggestsWifiExit: aiSeed.suggestsWifiExit } : undefined}
    />
  );
}
