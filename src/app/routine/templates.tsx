import { router } from 'expo-router';

import { TemplateList } from '@/features/routine-templates/TemplateList';

/** P10. No guarda nada: "Usar plantilla" abre P04 con el borrador precargado para revisarlo. */
export default function TemplatesScreen() {
  return (
    <TemplateList onUse={(template) => router.push({ pathname: '/routine/new', params: { templateId: template.id } })} />
  );
}
