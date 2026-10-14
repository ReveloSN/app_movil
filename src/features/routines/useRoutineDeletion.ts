import { useState } from 'react';

import { cancelRoutineOccurrences } from '@/features/notifications/occurrence.lifecycle';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';

import { useRoutines } from './useRoutines';

/**
 * Flujo de "Eliminar rutina" (04-7 + DC-01): pedir confirmación, borrar y dejar de notificar.
 * Sin `routineId` (modo crear) no hace nada.
 */
export function useRoutineDeletion(routineId: string | undefined, onDeleted: () => void) {
  const { deleteRoutine } = useRoutines();
  const { rearm } = useTriggerRuntime();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!routineId || deleting) return;
    setConfirming(false);
    setDeleting(true);
    setError(null);
    const result = await deleteRoutine(routineId);
    setDeleting(false);
    if (result.status === 'failed') {
      setError(result.error);
      return;
    }
    // Lo que ya sonó de esta rutina no debe terminar registrado como "sin respuesta".
    cancelRoutineOccurrences(routineId)
      .then(rearm)
      .catch((cause: unknown) => {
        if (__DEV__) console.warn('[routines.delete.notifications]', cause);
      });
    onDeleted();
  }

  return {
    confirming,
    ask: () => setConfirming(true),
    cancel: () => setConfirming(false),
    confirm,
    deleting,
    error,
  };
}
