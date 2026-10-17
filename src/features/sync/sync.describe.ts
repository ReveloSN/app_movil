import type { LocalTableName, LocalTables, OutboxFailure, OutboxOp } from '@/db/local/local-document.types';
import { formatList } from '@/shared/utils/formatList';

import {
  CHANGE_TITLES,
  DELETE_ROUTINE_TITLE,
  DEPENDENT_LABELS,
  DISCARD_SINGLE_MESSAGE,
  discardWithDependentsMessage,
  FAILURE_REASONS,
  recordTitle,
  UNKNOWN_FAILURE,
} from './sync.copy';

const text = (value: unknown) => (typeof value === 'string' && value ? value : null);

/** Nombre visible de la fila: el de la copia local si sigue ahí, si no el que trae el cambio. */
function nameFor(table: LocalTableName, id: string, values: Record<string, unknown>, tables: LocalTables): string | null {
  const routineName = (routineId: unknown) => tables.routines.find((routine) => routine.id === routineId)?.name ?? null;
  switch (table) {
    case 'routines':
      return routineName(id) ?? text(values.name);
    case 'items':
      return tables.items.find((item) => item.id === id)?.label ?? text(values.label);
    case 'triggers':
      return routineName(tables.triggers.find((trigger) => trigger.id === id)?.routineId ?? values.routineId);
    case 'homeNetworks':
      return tables.homeNetworks.find((network) => network.id === id)?.displayName ?? text(values.displayName);
    case 'settings':
      return null;
  }
}

/** Qué cambio es, en palabras de la persona (para la lista de errores en Ajustes). */
export function describeChange(op: OutboxOp, tables: LocalTables): string {
  switch (op.kind) {
    case 'deleteRoutine':
      return DELETE_ROUTINE_TITLE;
    case 'insertRecord':
      return recordTitle(tables.routines.find((routine) => routine.id === op.record.routineId)?.name ?? null);
    default: {
      const values = op.kind === 'insert' ? op.values : op.kind === 'update' ? op.changes : {};
      return CHANGE_TITLES[op.table][op.kind](nameFor(op.table, op.id, values, tables));
    }
  }
}

export const failureReason = (failure: OutboxFailure | undefined) =>
  (failure?.code && FAILURE_REASONS[failure.code]) || UNKNOWN_FAILURE;

type DependentKind = keyof typeof DEPENDENT_LABELS;
const ORDER: readonly DependentKind[] = ['items', 'triggers', 'records', 'routines', 'homeNetworks', 'settings'];
const kindOf = (op: OutboxOp): DependentKind | null =>
  op.kind === 'insertRecord' ? 'records' : op.kind === 'deleteRoutine' ? 'routines' : op.table;

/** Confirmación de "Descartar": `discarded` empieza por el cambio fallido y sigue con sus dependientes. */
export function discardMessage(discarded: readonly OutboxOp[]): string {
  const [main, ...dependents] = discarded;
  if (dependents.length === 0) return DISCARD_SINGLE_MESSAGE;

  const counts = new Map<DependentKind, number>();
  for (const op of dependents) {
    const kind = kindOf(op);
    if (kind) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  const parts = ORDER.flatMap((kind) => (counts.has(kind) ? [DEPENDENT_LABELS[kind](counts.get(kind) ?? 0)] : []));
  const ofRoutine = main?.kind === 'insert' && main.table === 'routines';
  return discardWithDependentsMessage(formatList(parts), ofRoutine);
}
