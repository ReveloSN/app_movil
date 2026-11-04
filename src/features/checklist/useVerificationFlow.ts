import { router, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';

import { closeRoutineOccurrences } from '@/features/notifications/occurrence.lifecycle';
import { dispatchToOwner } from '@/features/forms/useUnsavedChangesGuard';
import { hapticConfirm } from '@/shared/haptics/haptics';

import * as copy from './checklist.copy';
import { firstUncheckedCritical, isEmptyDone } from './checklist.outcome';
import type { ChecklistItemState, ChecklistProgress, FinishIntent, VerificationSummary } from './checklist.types';
import { toSummaryParams } from './summaryParams';

export type VerificationDialog =
  | { kind: 'critical'; label: string; intent: FinishIntent }
  | { kind: 'empty' }
  | { kind: 'exit'; action: NavigationAction }
  | null;

// Los diálogos de salir y de "Listo" sin marcar comparten botones del brief; el crítico (DC-02) tiene los suyos.
export function dialogCopy(dialog: VerificationDialog) {
  if (dialog?.kind === 'critical') {
    return { message: copy.criticalSkipMessage(dialog.label), confirm: copy.CRITICAL_SKIP_CONFIRM, cancel: copy.CRITICAL_SKIP_CANCEL };
  }
  if (dialog?.kind === 'empty') {
    return { message: copy.EMPTY_DONE_MESSAGE, confirm: copy.CRITICAL_SKIP_CONFIRM, cancel: copy.CRITICAL_SKIP_CANCEL };
  }
  return { message: copy.EXIT_MESSAGE, confirm: copy.EXIT_CONFIRM, cancel: copy.EXIT_CANCEL };
}

interface VerificationFlowOptions {
  routineId: string;
  items: readonly ChecklistItemState[];
  progress: ChecklistProgress;
  finish(intent: FinishIntent): Promise<VerificationSummary | null>;
  /** Quita el borrador del día una vez guardado el registro. */
  discardDraft(): Promise<void>;
  /** Háptico de "completada" al terminar; el modo salida ya lo da al celebrar. */
  confirmHaptic?: boolean;
}

/**
 * Cierre de la verificación compartido por la vista de lista (verify) y el modo salida (go): confirmaciones
 * (crítico sin marcar, "Listo" vacío, salir con ítems marcados), guardado del registro y paso al resumen.
 */
export function useVerificationFlow({ routineId, items, progress, finish, discardDraft, confirmHaptic = true }: VerificationFlowOptions) {
  const navigation = useNavigation();
  const [dialog, setDialog] = useState<VerificationDialog>(null);
  // true cuando la salida ya está decidida (terminó o confirmó "Salir"): no se vuelve a preguntar.
  const leaving = useRef(false);

  // Cubre la X, el botón atrás de Android y el gesto de iOS: solo pregunta si ya hay algo marcado.
  usePreventRemove(progress.checked > 0, ({ data }) => {
    if (leaving.current) dispatchToOwner(navigation, data.action);
    else setDialog({ kind: 'exit', action: data.action });
  });

  /** Guarda el registro y abre el resumen. Devuelve false si no se pudo guardar (el error lo da useFinishChecklist). */
  async function complete(intent: FinishIntent): Promise<boolean> {
    const summary = await finish(intent);
    if (!summary) return false;
    await discardDraft(); // Ya quedó guardada: el widget deja de mostrar lo marcado.
    if (confirmHaptic && summary.outcome === 'completed') hapticConfirm();
    // Las notificaciones ya sonadas de esta rutina quedan respondidas (no cuentan como "sin respuesta").
    closeRoutineOccurrences(routineId, Date.now()).catch((cause: unknown) => {
      if (__DEV__) console.warn('[notifications.close]', cause);
    });
    leaving.current = true;
    router.replace({ pathname: '/routine/[id]/summary', params: toSummaryParams(routineId, summary) });
    return true;
  }

  // DC-02 antes de dejar sin marcar un crítico, con "Listo" o con "Omitir por hoy".
  function finishAsking(intent: FinishIntent) {
    if (isEmptyDone(items, intent)) {
      setDialog({ kind: 'empty' });
      return;
    }
    const critical = firstUncheckedCritical(items);
    if (critical) setDialog({ kind: 'critical', label: critical.label, intent });
    else void complete(intent);
  }

  function confirmDialog() {
    if (dialog?.kind === 'critical') void complete(dialog.intent);
    // Confirmó que no marcó nada: se guarda como omitida, no como parcial de 0.
    if (dialog?.kind === 'empty') void complete('skip');
    if (dialog?.kind === 'exit') {
      leaving.current = true;
      dispatchToOwner(navigation, dialog.action);
    }
    setDialog(null);
  }

  return {
    dialog,
    dialogText: dialogCopy(dialog),
    cancelDialog: () => setDialog(null),
    confirmDialog,
    finishAsking,
    complete,
    /** La salida ya está decidida (ej. al posponer): no se pregunta de nuevo. */
    markLeaving: () => {
      leaving.current = true;
    },
  };
}
