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

/** Lo del servidor más las verificaciones que aún esperan en la cola (sin repetir las que ya llegaron). */
export function withPendingRecords(remote: readonly VerificationRecord[], outbox: readonly OutboxOp[]): HistoryRecord[] {
  const remoteIds = new Set(remote.map((record) => record.id));
  const pending = outbox.flatMap((op) =>
    op.kind === 'insertRecord' && !remoteIds.has(op.record.id) ? [{ ...toRecord(op.record), pending: true }] : [],
  );
  return [...remote.map((record) => ({ ...record, pending: false })), ...pending];
}
