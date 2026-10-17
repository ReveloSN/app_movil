import type { OutboxOp } from '../local/local-document.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

/**
 * Historial local tras bajar del servidor: manda lo del servidor; se conservan las verificaciones hechas
 * aquí que aún esperan en la cola (no llegaron), y se quitan las de rutinas borradas aquí sin subir.
 * Lo que solo estaba aquí y ya no está en la cola ni en el servidor desaparece (se descartó).
 */
export function mergeRecords(
  local: readonly VerificationRecord[],
  remote: readonly VerificationRecord[],
  outbox: readonly OutboxOp[],
): VerificationRecord[] {
  const pendingIds = new Set(outbox.flatMap((op) => (op.kind === 'insertRecord' ? [op.record.id] : [])));
  const deletedRoutines = new Set(outbox.flatMap((op) => (op.kind === 'deleteRoutine' ? [op.id] : [])));
  const remoteIds = new Set(remote.map((record) => record.id));
  const kept = local.filter((record) => pendingIds.has(record.id) && !remoteIds.has(record.id));
  return [...remote, ...kept].filter((record) => !deletedRoutines.has(record.routineId));
}

/** Misma lista (ids y orden) que antes: no hace falta guardar ni avisar. */
export const sameRecords = (a: readonly VerificationRecord[], b: readonly VerificationRecord[]) =>
  a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
