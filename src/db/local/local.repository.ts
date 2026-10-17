import * as Crypto from 'expo-crypto';

import { RepositoryError, type Repository, type RepositoryOperation } from '../repositories/repository.types';

import type { LocalTableName, LocalTables, OutboxChange, OutboxMeta } from './local-document.types';
import type { LocalStore } from './local.store';
import { enqueue } from './outbox.compaction';

/** Reloj e ids inyectables (tests deterministas). */
export interface LocalDeps {
  /** ISO 8601. */
  now(): string;
  newId(): string;
}

export interface LocalTableConfig<TEntity, TCreate> {
  table: LocalTableName;
  select(tables: LocalTables): TEntity[];
  replace(tables: LocalTables, rows: TEntity[]): LocalTables;
  idOf(row: TEntity): string;
  /** Id fijo de la fila (ajustes: el del usuario). Si no, el del input o uno nuevo. */
  rowId?(userId: string): string;
  /** Fila nueva con los mismos valores por defecto que la base de datos. */
  build(input: TCreate, meta: { id: string; userId: string; now: string }): TEntity;
  /** Mismo orden que el repositorio de Supabase. */
  compare?(a: TEntity, b: TEntity): number;
}

/** Repository + búsqueda por campo, como el de Supabase pero sobre la copia local. */
export interface LocalRepository<TEntity, TCreate, TUpdate> extends Repository<TEntity, TCreate, TUpdate> {
  listWhere(field: keyof TEntity, value: unknown): Promise<TEntity[]>;
  deleteWhere(field: keyof TEntity, value: unknown): Promise<void>;
}

export const defaultLocalDeps: LocalDeps = {
  now: () => new Date().toISOString(),
  newId: () => Crypto.randomUUID(),
};

/** Quita las claves undefined: no son cambios (igual que en el repositorio de Supabase). */
export const definedOnly = (input: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));

export function newOp<C extends OutboxChange>(change: C, at: string, deps: LocalDeps): C & OutboxMeta {
  return { ...change, opId: deps.newId(), queuedAt: at, at, attempts: 0 };
}

/**
 * Local-first: lee y escribe solo en el teléfono, y cada escritura deja su operación en la outbox en el
 * mismo guardado (atómico). La sincronización (Fase 4) la sube después.
 */
export function createLocalRepository<TEntity extends { updatedAt: string }, TCreate extends object, TUpdate extends object>(
  store: LocalStore,
  config: LocalTableConfig<TEntity, TCreate>,
  deps: LocalDeps,
): LocalRepository<TEntity, TCreate, TUpdate> {
  const { table } = config;
  const sorted = (rows: TEntity[]) => (config.compare ? [...rows].sort(config.compare) : [...rows]);
  const notFound = (operation: RepositoryOperation) =>
    new RepositoryError(table, operation, 'other', 'not_found', 'La fila no existe en el teléfono.');

  /** Borra las filas que cumplen `matches` y encola un delete por cada una. */
  const removeWhere = (matches: (row: TEntity) => boolean) => {
    const now = deps.now();
    return store.update((doc) => {
      const rows = config.select(doc.tables);
      const removed = rows.filter(matches);
      if (removed.length === 0) return { doc, result: undefined }; // Como en el servidor: borrar lo que no existe no falla.
      const outbox = removed.reduce(
        (pending, row) => enqueue(pending, newOp({ kind: 'delete', table, id: config.idOf(row) }, now, deps)),
        doc.outbox,
      );
      const tables = config.replace(doc.tables, rows.filter((row) => !matches(row)));
      return { doc: { ...doc, tables, outbox }, result: undefined };
    });
  };

  return {
    async getAll() {
      return sorted(config.select((await store.read()).tables));
    },

    async listWhere(field, value) {
      return sorted(config.select((await store.read()).tables).filter((row) => row[field] === value));
    },

    async create(input) {
      const now = deps.now();
      const id = config.rowId?.(store.userId) ?? (input as { id?: string }).id ?? deps.newId();
      const row = config.build(input, { id, userId: store.userId, now });
      const change = { kind: 'insert' as const, table, id, values: { ...definedOnly(input), id, updatedAt: now } };

      return store.update((doc) => {
        const rows = config.select(doc.tables);
        if (rows.some((existing) => config.idOf(existing) === id)) {
          throw new RepositoryError(table, 'create', 'conflict', '23505', 'La fila ya existe en el teléfono.');
        }
        const outbox = enqueue(doc.outbox, newOp(change, now, deps));
        return { doc: { ...doc, tables: config.replace(doc.tables, [...rows, row]), outbox }, result: row };
      });
    },

    async update(id, changes) {
      const now = deps.now();
      const defined = definedOnly(changes);

      return store.update((doc) => {
        const rows = config.select(doc.tables);
        const current = rows.find((row) => config.idOf(row) === id);
        if (!current) throw notFound('update');
        const updated = { ...current, ...defined, updatedAt: now };
        const outbox = enqueue(doc.outbox, newOp({ kind: 'update', table, id, changes: defined }, now, deps));
        const tables = config.replace(doc.tables, rows.map((row) => (row === current ? updated : row)));
        return { doc: { ...doc, tables, outbox }, result: updated };
      });
    },

    delete: (id) => removeWhere((row) => config.idOf(row) === id),

    deleteWhere: (field, value) => removeWhere((row) => row[field] === value),
  };
}
