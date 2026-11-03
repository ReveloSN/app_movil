import { capForgotEvents } from '../local/forgot.events';
import type { OutboxOp } from '../local/local-document.types';
import type { ForgotEvent } from '@/shared/types/forgot-event.types';

/**
 * Olvidos locales tras bajar del servidor (igual que mergeRecords): manda lo del servidor; se conservan
 * los anotados aquí que aún esperan en la cola, y se quitan los de rutinas borradas aquí sin subir.
 * Lo que solo estaba aquí y ya no está en la cola ni en el servidor desaparece (se descartó, o se
 * borró su rutina en otro dispositivo). Como mucho FORGOT_EVENTS_LIMIT, los más recientes.
 */
export function mergeForgotEvents(
  local: readonly ForgotEvent[],
  remote: readonly ForgotEvent[],
  outbox: readonly OutboxOp[],
): ForgotEvent[] {
  const pendingIds = new Set(outbox.flatMap((op) => (op.kind === 'insertForgot' ? [op.event.id] : [])));
  const deletedRoutines = new Set(outbox.flatMap((op) => (op.kind === 'deleteRoutine' ? [op.id] : [])));
  const remoteIds = new Set(remote.map((event) => event.id));
  const kept = local.filter((event) => pendingIds.has(event.id) && !remoteIds.has(event.id));
  return capForgotEvents([...remote, ...kept].filter((event) => !deletedRoutines.has(event.routineId)));
}

/** Misma lista (ids y orden) que antes: no hace falta guardar ni avisar. */
export const sameForgotEvents = (a: readonly ForgotEvent[], b: readonly ForgotEvent[]) =>
  a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
