import * as Crypto from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { findPresetTemplate } from '@/features/routine-templates/routine-templates.data';
import { RoutineForm } from '@/features/routines/RoutineForm';

/** P04 en modo crear. Con ?templateId= llega precargada desde Plantillas (P10). */
export default function NewRoutineScreen() {
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const template = findPresetTemplate(templateId);
  // Los avisos se editan en P06 (otra pantalla): se comparten por este id de formulario.
  const [formId] = useState(() => Crypto.randomUUID());

  return (
    <RoutineForm
      formId={formId}
      initialDraft={template ? { name: template.name, icon: template.icon, items: [...template.items] } : undefined}
    />
  );
}
