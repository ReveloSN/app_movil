import * as Crypto from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { LoadingState } from '@/components/molecules/LoadingState';
import { LOAD_ROUTINE_ERROR, ROUTINE_NOT_FOUND } from '@/features/routines/routine.copy';
import { RoutineForm } from '@/features/routines/RoutineForm';
import { useLoadedRoutine } from '@/features/routines/useLoadedRoutine';
import { useRoutines } from '@/features/routines/useRoutines';
import { useTriggerDrafts } from '@/features/triggers/TriggerDraftsProvider';

/** P04 en modo edición: carga la rutina completa (ítems y avisos) y abre el mismo formulario. */
export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routines, loading: routinesLoading, error: routinesError, refresh } = useRoutines();
  const routine = routines.find((item) => item.id === id);
  const [formId] = useState(() => Crypto.randomUUID());
  const { upsert } = useTriggerDrafts(formId);
  // Los avisos guardados se siembran como borradores: P06 los edita igual que a uno nuevo.
  const { state, retry } = useLoadedRoutine(routine, (loaded) => loaded.triggers.forEach(upsert));

  if (!routine) {
    if (routinesLoading) return <LoadingState accessibilityLabel="Cargando rutina" />;
    if (routinesError) return <ErrorState message={routinesError} onRetry={refresh} />;
    return <EmptyState icon="help-circle-outline" message={ROUTINE_NOT_FOUND} />;
  }
  if (state.status === 'loading') return <LoadingState accessibilityLabel="Cargando rutina" />;
  if (state.status === 'error') return <ErrorState message={LOAD_ROUTINE_ERROR} onRetry={retry} />;

  return (
    <RoutineForm
      formId={formId}
      initialDraft={state.loaded.draft}
      editing={{ routine, original: state.loaded.original }}
    />
  );
}
