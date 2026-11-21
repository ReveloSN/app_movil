import type { LocalTableName, LocalTables, OutboxFailure, OutboxOp } from '@/db/local/local-document.types';
import { formatList } from '@/shared/utils/formatList';

import copy from './sync.copy';

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
      return copy.DELETE_ROUTINE_TITLE;
    case 'insertRecord':
      return copy.recordTitle(tables.routines.find((routine) => routine.id === op.record.routineId)?.name ?? null);
    case 'insertForgot':
      return copy.forgotTitle(op.event.label);
    default: {
      const values = op.kind === 'insert' ? op.values : op.kind === 'update' ? op.changes : {};
      return copy.CHANGE_TITLES[op.table][op.kind](nameFor(op.table, op.id, values, tables));
    }
  }
}

export const failureReason = (failure: OutboxFailure | undefined) =>
  (failure?.code && copy.FAILURE_REASONS[failure.code]) || copy.UNKNOWN_FAILURE;

type DependentKind = keyof typeof copy.DEPENDENT_LABELS;
const ORDER: readonly DependentKind[] = ['items', 'triggers', 'records', 'forgotEvents', 'routines', 'homeNetworks', 'settings'];
function kindOf(op: OutboxOp): DependentKind | null {
  switch (op.kind) {
    case 'insertRecord':
      return 'records';
    case 'insertForgot':
      return 'forgotEvents';
    case 'deleteRoutine':
      return 'routines';
    default:
      return op.table;
  }
}

/** Confirmación de "Descartar": `discarded` empieza por el cambio fallido y sigue con sus dependientes. */
export function discardMessage(discarded: readonly OutboxOp[]): string {
  const [main, ...dependents] = discarded;
  if (dependents.length === 0) return copy.DISCARD_SINGLE_MESSAGE;

  const counts = new Map<DependentKind, number>();
  for (const op of dependents) {
    const kind = kindOf(op);
    if (kind) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  const parts = ORDER.flatMap((kind) => (counts.has(kind) ? [copy.DEPENDENT_LABELS[kind](counts.get(kind) ?? 0)] : []));
  const ofRoutine = main?.kind === 'insert' && main.table === 'routines';
  return copy.discardWithDependentsMessage(formatList(parts), ofRoutine);
}
