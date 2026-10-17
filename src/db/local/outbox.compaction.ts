import type { OutboxOp, OutboxOpOf, RowRef } from './local-document.types';
import { referencesOf, sameRow, targetOf } from './outbox.dependencies';

const touches = (op: OutboxOp, row: RowRef) => {
  const target = targetOf(op);
  return target !== null && sameRow(target, row);
};

const isInsertOf = (op: OutboxOp, row: RowRef) => op.kind === 'insert' && touches(op, row);

/** Se está enviando: puede haber llegado al servidor, así que no se mezcla ni se quita. */
const inFlight = (op: OutboxOp) => op.sendingSince !== undefined;

/** Un insert que todavía no salió hacia el servidor (si se borra la fila, no queda nada que enviar). */
const isUnsentInsertOf = (op: OutboxOp, row: RowRef) => isInsertOf(op, row) && !inFlight(op);

/**
 * Un update se mezcla con lo pendiente de la misma fila (§2.2):
 * - insert + update → un solo insert con los valores finales, en el lugar del insert. Solo si eso no
 *   adelanta una clave foránea a una fila que se crea después (ej. el aviso que pasa a usar una red nueva).
 * - update + update → un solo update, al final (moverlo después nunca rompe dependencias).
 * Detrás de una operación fallida o que se está enviando no se mezcla nada: queda aparte, en orden.
 */
function enqueueUpdate(outbox: readonly OutboxOp[], op: OutboxOpOf<'update'>): OutboxOp[] {
  const row = { table: op.table, id: op.id };
  const own = outbox.filter((pending) => touches(pending, row));
  const last = own.at(-1);
  if (!last || own.some((pending) => pending.failed || inFlight(pending))) return [...outbox, op];

  if (last.kind === 'update') {
    const merged = { ...op, changes: { ...last.changes, ...op.changes } };
    return [...outbox.filter((pending) => pending !== last), merged];
  }

  if (last.kind === 'insert') {
    const position = outbox.indexOf(last);
    const safe = referencesOf(op).every((reference) => {
      const inserted = outbox.findIndex((pending) => isInsertOf(pending, reference));
      return inserted === -1 || inserted < position;
    });
    if (safe) {
      const merged = { ...last, at: op.at, values: { ...last.values, ...op.changes, updatedAt: op.at } };
      return outbox.map((pending) => (pending === last ? merged : pending));
    }
  }
  return [...outbox, op];
}

/** Un delete anula lo pendiente de la fila (salvo lo que se está enviando); si su insert nunca salió, no queda nada que hacer. */
function enqueueDelete(outbox: readonly OutboxOp[], op: OutboxOpOf<'delete'>): OutboxOp[] {
  const row = { table: op.table, id: op.id };
  const neverSent = outbox.some((pending) => isUnsentInsertOf(pending, row));
  const rest = outbox.filter((pending) => inFlight(pending) || !touches(pending, row));
  return neverSent ? rest : [...rest, op];
}

/** Agrega `op` al final de la cola, compactando con lo pendiente de la misma fila. */
export function enqueue(outbox: readonly OutboxOp[], op: OutboxOp): OutboxOp[] {
  switch (op.kind) {
    case 'update':
      return enqueueUpdate(outbox, op);
    case 'delete':
      return enqueueDelete(outbox, op);
    case 'insertRecord':
      // El id lo genera el cliente: una misma verificación nunca se encola dos veces.
      return outbox.some((pending) => pending.kind === 'insertRecord' && pending.record.id === op.record.id)
        ? [...outbox]
        : [...outbox, op];
    default:
      return [...outbox, op];
  }
}

/**
 * Borrar una rutina reemplaza todo lo pendiente de ella, de sus hijos (`children`: sus ítems y avisos)
 * y de sus verificaciones: en el servidor, el borrado en cascada se lleva todo. Si la rutina nunca
 * llegó al servidor, no queda nada que enviar.
 */
export function enqueueRoutineDeletion(
  outbox: readonly OutboxOp[],
  op: OutboxOpOf<'deleteRoutine'>,
  children: readonly RowRef[],
): OutboxOp[] {
  const routine: RowRef = { table: 'routines', id: op.id };
  const rows = [routine, ...children];
  const neverSent = outbox.some((pending) => isUnsentInsertOf(pending, routine));
  const rest = outbox.filter(
    (pending) =>
      inFlight(pending) ||
      (!rows.some((row) => touches(pending, row)) &&
        !(pending.kind === 'insertRecord' && pending.record.routineId === op.id)),
  );
  return neverSent ? rest : [...rest, op];
}
