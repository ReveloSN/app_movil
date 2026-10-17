import type { OutboxOp, PendingRecord } from '@/db/local/local-document.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

/** Registro del historial: `pending` si todavía espera en la cola para subir. */
export type HistoryRecord = VerificationRecord & { pending: boolean };

const toRecord = (record: PendingRecord): VerificationRecord => ({
  id: record.id,
  routineId: record.routineId,
  date: record.date ?? '',
  result: record.result,
  itemsChecked: record.itemsChecked ?? null,
  durationSeconds: record.durationSeconds ?? null,
});

/**
 * El historial local más lo que espera en la cola y aún no está en él (p. ej. lo encolado por una
 * versión anterior de la app), sin repetir. Pendiente = todavía en la cola.
 */
export function withPendingRecords(local: readonly VerificationRecord[], outbox: readonly OutboxOp[]): HistoryRecord[] {
  const queued = new Map(outbox.flatMap((op) => (op.kind === 'insertRecord' ? [[op.record.id, op.record] as const] : [])));
  const localIds = new Set(local.map((record) => record.id));
  const onlyQueued = [...queued.values()].filter((record) => !localIds.has(record.id));
  return [
    ...local.map((record) => ({ ...record, pending: queued.has(record.id) })),
    ...onlyQueued.map((record) => ({ ...toRecord(record), pending: true })),
  ];
}
