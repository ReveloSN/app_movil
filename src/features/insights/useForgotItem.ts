import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/features/feedback/toast.context';
import { useLocalRepositories } from '@/features/local-data/LocalRepositoriesProvider';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import { MAX_ITEMS, validateItemDraft } from '@/features/routines/routine.validation';
import { hapticToggleOn } from '@/shared/haptics/haptics';

import * as copy from './insights.copy';
import { createForgotStore } from './insights.stores';

/**
 * "Olvidé algo" (P08): anota el olvido de esta verificación y, si cabe (máx. 12), añade el ítem a la
 * rutina al instante. Devuelve true si terminó (la hoja se cierra) o false con el error a la vista.
 */
export function useForgotItem(routineId: string, recordId: string | null) {
  const local = useLocalRepositories();
  const { user } = useAuth();
  const { rearm } = useTriggerRuntime();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(
    async (rawLabel: string): Promise<boolean> => {
      const label = rawLabel.trim();
      const invalid = validateItemDraft({ label, note: '' }).label;
      if (invalid) {
        setError(invalid);
        return false;
      }
      if (!user) return false;
      setSaving(true);
      setError(null);
      try {
        await createForgotStore(user.id).add({ id: Crypto.randomUUID(), routineId, recordId, label, date: new Date().toISOString() });
        const items = await local.items.getByRoutine(routineId);
        if (items.length >= MAX_ITEMS) {
          toast.show({ message: copy.FORGOT_FULL, tone: 'info' });
          return true;
        }
        await local.items.create({ routineId, label, type: 'carry', critical: false, sortOrder: items.length });
        hapticToggleOn();
        toast.show(copy.forgotAdded(label));
        // El cuerpo de las notificaciones lista los ítems: se reprograma con el nuevo.
        rearm().catch((cause: unknown) => {
          if (__DEV__) console.warn('[insights.forgot.rearm]', cause);
        });
        return true;
      } catch (cause) {
        if (__DEV__) console.warn('[insights.forgot]', cause);
        setError(copy.FORGOT_ERROR);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [local, user, routineId, recordId, rearm, toast],
  );

  return { add, saving, error, clearError: () => setError(null) };
}
