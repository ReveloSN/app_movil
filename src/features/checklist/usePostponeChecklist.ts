import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { DEFAULT_PREFS, loadNotificationPrefs } from '@/features/notifications/notification.prefs';
import { postponeRoutine } from '@/features/notifications/occurrence.lifecycle';

import { POSTPONE_ERROR } from './checklist.copy';

interface PostponeInput {
  routineId: string;
  routineName: string;
  itemCount: number;
}

/**
 * "Posponer N min" de P07 (07-6). Usa el mismo servicio que la acción de la notificación; N es el
 * valor de Ajustes (copia local que también lee la tarea en segundo plano). No crea registro: la vez
 * queda abierta y termina como verificación o, sin respuesta, "no_response".
 */
export function usePostponeChecklist({ routineId, routineName, itemCount }: PostponeInput) {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  const [snoozeMinutes, setSnoozeMinutes] = useState(DEFAULT_PREFS.snoozeMinutes);
  const [postponing, setPostponing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadNotificationPrefs().then((prefs) => {
      if (active) setSnoozeMinutes(prefs.snoozeMinutes);
    });
    return () => {
      active = false;
    };
  }, []);

  /** Devuelve true si quedó pospuesta (la pantalla entonces se cierra). */
  const postpone = useCallback(async (): Promise<boolean> => {
    if (!ownerId) return false;
    setPostponing(true);
    setError(null);
    try {
      await postponeRoutine({ routineId, routineName, itemCount, ownerId }, Date.now(), await loadNotificationPrefs());
      return true;
    } catch (cause) {
      if (__DEV__) console.warn('[checklist.postpone]', cause);
      setError(POSTPONE_ERROR);
      return false;
    } finally {
      setPostponing(false);
    }
  }, [ownerId, routineId, routineName, itemCount]);

  return { snoozeMinutes, postpone, postponing, error };
}
