import type { LocalDocument, LocalTableName, LocalTables, OutboxOp } from '../local/local-document.types';
import { targetOf } from '../local/outbox.dependencies';

type Row = Record<string, unknown>;

const TABLES: readonly LocalTableName[] = ['routines', 'items', 'triggers', 'homeNetworks', 'settings'];

/** Campos que solo pone el servidor: la copia local nunca los pisa, aunque la fila tenga cambios pendientes. */
const SERVER_OWNED: Partial<Record<LocalTableName, readonly string[]>> = {
  routines: ['userId', 'createdAt', 'lastCompletedAt'],
  homeNetworks: ['userId'],
  settings: ['userId'],
};

const idOf = (table: LocalTableName, row: Row) => String(table === 'settings' ? row.userId : row.id);

/** Filas con algo pendiente de subir (incluidas las borradas aquí): lo local manda sobre ellas. */
const pendingKeys = (outbox: readonly OutboxOp[]) =>
  new Set(
    outbox.flatMap((op) => {
      const target = targetOf(op);
      return target ? [`${target.table}:${target.id}`] : [];
    }),
  );

function mergeTable(table: LocalTableName, local: Row[], remote: Row[], pending: Set<string>, deletedRoutines: Set<string>): Row[] {
  const key = (row: Row) => `${table}:${idOf(table, row)}`;
  const localByKey = new Map(local.map((row) => [key(row), row]));
  // Hijos de una rutina que se borró aquí y aún no se subió: no vuelven.
  const orphan = (row: Row) => (table === 'items' || table === 'triggers') && deletedRoutines.has(String(row.routineId));
  const serverOwned = SERVER_OWNED[table] ?? [];

  const fromServer = remote.flatMap((row) => {
    if (orphan(row)) return [];
    if (!pending.has(key(row))) return [row];
    const mine = localByKey.get(key(row));
    if (!mine) return []; // Borrada aquí: el delete está en camino.
    return [{ ...mine, ...Object.fromEntries(serverOwned.map((field) => [field, row[field]])) }];
  });
  const remoteKeys = new Set(remote.map(key));
  const localOnly = local.filter((row) => !remoteKeys.has(key(row)) && pending.has(key(row)));
  return [...fromServer, ...localOnly];
}

/** Representación estable (sin depender del orden de filas ni de claves) para saber si algo cambió. */
const canonical = (tables: LocalTables) =>
  JSON.stringify(
    TABLES.map((table) =>
      (tables[table] as unknown as Row[])
        .map((row) => JSON.stringify(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))))
        .sort(),
    ),
  );

/**
 * Mezcla lo bajado del servidor con la copia local (§2.3): el servidor reemplaza lo que no tiene cambios
 * pendientes; lo pendiente conserva lo local salvo los campos que solo pone el servidor; lo creado aquí
 * sin subir se queda; lo borrado en otro dispositivo (sin nada pendiente aquí) desaparece.
 * Si no cambia nada, devuelve las mismas tablas (mismo objeto): así no se avisa a nadie.
 */
export function mergePulled(doc: LocalDocument, remote: LocalTables): LocalTables {
  const pending = pendingKeys(doc.outbox);
  const deletedRoutines = new Set(doc.outbox.flatMap((op) => (op.kind === 'deleteRoutine' ? [op.id] : [])));

  const merged = Object.fromEntries(
    TABLES.map((table) => [
      table,
      mergeTable(table, doc.tables[table] as unknown as Row[], remote[table] as unknown as Row[], pending, deletedRoutines),
    ]),
  ) as unknown as LocalTables;

  return canonical(merged) === canonical(doc.tables) ? doc.tables : merged;
}
