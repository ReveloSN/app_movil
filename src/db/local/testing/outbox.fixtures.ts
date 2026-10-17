import type { OutboxChange, OutboxMeta, PendingRecord } from '../local-document.types';

let sequence = 0;

/** Operación de la outbox para tests: `at` sube en cada llamada para que el orden sea explícito. */
export function op<C extends OutboxChange>(change: C, overrides: Partial<OutboxMeta> = {}): C & OutboxMeta {
  sequence += 1;
  const at = new Date(Date.UTC(2026, 9, 14, 10, 0, sequence)).toISOString();
  return { ...change, opId: `op-${sequence}`, queuedAt: at, at, attempts: 0, ...overrides };
}

export const failure = { code: '23514', message: 'check_violation' };

export const record = (id: string, routineId: string): PendingRecord => ({
  id,
  routineId,
  result: 'completed',
  date: '2026-10-14T10:00:00.000Z',
  itemsChecked: null,
  durationSeconds: 30,
});
