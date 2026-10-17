import type { LocalTableName, OutboxChange, OutboxOp, RowRef } from './local-document.types';

/** Claves foráneas que puede traer un cambio: campo del dominio → tabla a la que apunta. */
const FOREIGN_KEYS: Partial<Record<LocalTableName, Record<string, LocalTableName>>> = {
  items: { routineId: 'routines' },
  triggers: { routineId: 'routines', networkId: 'homeNetworks' },
};

const rowKey = (row: RowRef) => `${row.table}:${row.id}`;

export const sameRow = (a: RowRef, b: RowRef) => a.table === b.table && a.id === b.id;

/** Fila que modifica la operación. null para una verificación: ninguna operación depende de ella. */
export function targetOf(change: OutboxChange): RowRef | null {
  switch (change.kind) {
    case 'insert':
    case 'update':
    case 'delete':
      return { table: change.table, id: change.id };
    case 'deleteRoutine':
      return { table: 'routines', id: change.id };
    case 'insertRecord':
      return null;
  }
}

/** Filas que tienen que existir en el servidor para que la operación funcione (sus claves foráneas). */
export function referencesOf(change: OutboxChange): RowRef[] {
  if (change.kind === 'insertRecord') return [{ table: 'routines', id: change.record.routineId }];
  if (change.kind !== 'insert' && change.kind !== 'update') return [];
  const values = change.kind === 'insert' ? change.values : change.changes;
  return Object.entries(FOREIGN_KEYS[change.table] ?? {}).flatMap(([field, table]) => {
    const id = values[field];
    return typeof id === 'string' ? [{ table, id }] : [];
  });
}

export type OpStatus = 'ready' | 'failed' | 'blocked';

export interface ClassifiedOp {
  op: OutboxOp;
  status: OpStatus;
}

/**
 * Estado de cada operación, en orden (§2.5). Queda bloqueada si antes hay una fallida o bloqueada
 * sobre la misma fila, o si apunta a una fila cuyo insert no llegó al servidor (fallido o bloqueado).
 * El bloqueo es transitivo y las operaciones independientes siguen listas.
 */
export function classifyOutbox(outbox: readonly OutboxOp[]): ClassifiedOp[] {
  const unsettled = new Set<string>(); // filas con una operación fallida o bloqueada
  const missing = new Set<string>(); // filas que no llegaron a crearse en el servidor

  return outbox.map((op) => {
    const target = targetOf(op);
    const blocked =
      (target !== null && unsettled.has(rowKey(target))) ||
      referencesOf(op).some((reference) => missing.has(rowKey(reference)));
    const status: OpStatus = op.failed ? 'failed' : blocked ? 'blocked' : 'ready';

    if (status !== 'ready' && target) {
      unsettled.add(rowKey(target));
      if (op.kind === 'insert') missing.add(rowKey(target));
    }
    return { op, status };
  });
}

function withoutFailure(op: OutboxOp): OutboxOp {
  const { failed: _failed, ...rest } = op;
  return rest as OutboxOp;
}

/** Operaciones que quedan bloqueadas solo por `opId` (directa o transitivamente). */
function dependentsOf(outbox: readonly OutboxOp[], opId: string): Set<string> {
  const placeholder = { code: null, message: 'dependency check' };
  const isolated = outbox.map((op) => (op.opId === opId ? { ...op, failed: op.failed ?? placeholder } : withoutFailure(op)));
  return new Set(
    classifyOutbox(isolated)
      .filter(({ status }) => status === 'blocked')
      .map(({ op }) => op.opId),
  );
}

/** Descarta una operación y las que dependen de ella (§2.5). `discarded` permite decir cuántas son antes. */
export function discardOp(outbox: readonly OutboxOp[], opId: string): { outbox: OutboxOp[]; discarded: OutboxOp[] } {
  const dependents = dependentsOf(outbox, opId);
  const isDiscarded = (op: OutboxOp) => op.opId === opId || dependents.has(op.opId);
  return { outbox: outbox.filter((op) => !isDiscarded(op)), discarded: outbox.filter(isDiscarded) };
}

/** Quita la marca de fallo: la operación (y las que bloqueaba) vuelven a intentarse. */
export function retryOp(outbox: readonly OutboxOp[], opId: string): OutboxOp[] {
  return outbox.map((op) => (op.opId === opId ? withoutFailure(op) : op));
}
