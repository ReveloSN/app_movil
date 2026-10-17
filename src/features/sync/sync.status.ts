import type { OutboxOp } from '@/db/local/local-document.types';
import { classifyOutbox } from '@/db/local/outbox.dependencies';

export interface OutboxSummary {
  /** Cambios aún sin subir que no fallaron (incluye los bloqueados). */
  pendingCount: number;
  /** De esos, los que esperan a que se resuelva uno fallido. */
  blockedCount: number;
  /** Rechazados por el servidor: se muestran en Ajustes para reintentar o descartar. */
  failed: OutboxOp[];
}

export function summarizeOutbox(outbox: readonly OutboxOp[]): OutboxSummary {
  const classified = classifyOutbox(outbox);
  return {
    pendingCount: classified.filter(({ status }) => status !== 'failed').length,
    blockedCount: classified.filter(({ status }) => status === 'blocked').length,
    failed: classified.filter(({ status }) => status === 'failed').map(({ op }) => op),
  };
}
