import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import {
  RepositoryError,
  type LastWriteWins,
  type Repository,
  type RepositoryErrorKind,
  type RepositoryOperation,
} from './repository.types';

/** Hora del último cambio, puesta por el cliente (no hay trigger que la sobrescriba). */
const UPDATED_AT_COLUMN = 'updated_at';

/** Valores de columna a escribir; las claves son nombres de columna en snake_case. */
type RowValues = Record<string, unknown>;

interface SupabaseRepositoryConfig<TRow, TEntity, TCreate, TUpdate> {
  client: SupabaseClient;
  table: string;
  /** Columna de clave primaria (por defecto `id`). */
  idColumn?: string;
  /** Orden por defecto de getAll y listWhere. */
  orderBy?: { column: string; ascending: boolean };
  /** Mapeos fila de BD (snake_case) ⇄ entidad de dominio (camelCase). */
  toEntity(row: TRow): TEntity;
  toInsertRow(input: TCreate): RowValues;
  toUpdateRow(changes: TUpdate): RowValues;
}

/**
 * Repository + consulta filtrada, para que cada repositorio exponga sus propios métodos de búsqueda.
 * updateIfOlder solo sirve en tablas con updated_at: los repositorios de las demás no lo exponen.
 */
export interface SupabaseRepository<TEntity, TCreate, TUpdate>
  extends Repository<TEntity, TCreate, TUpdate>,
    LastWriteWins<TUpdate> {
  /** Filas donde `column` = `value`, con el orden por defecto. */
  listWhere(column: string, value: string): Promise<TEntity[]>;
  /** Borra las filas donde `column` = `value` (las que RLS deje ver). */
  deleteWhere(column: string, value: string): Promise<void>;
}

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

// postgrest-js responde con status 0 cuando fetch falla (sin conexión, timeout, abortada).
function classify(error: PostgrestError, status: number): RepositoryErrorKind {
  if (status === 0) return 'network';
  if (error.code === UNIQUE_VIOLATION) return 'conflict';
  if (error.code === FOREIGN_KEY_VIOLATION) return 'referenced';
  return 'other';
}

/** Implementación de Repository sobre una tabla de Supabase. Las filas visibles las filtra RLS. */
export function createSupabaseRepository<TRow, TEntity, TCreate, TUpdate>({
  client,
  table,
  idColumn = 'id',
  orderBy,
  toEntity,
  toInsertRow,
  toUpdateRow,
}: SupabaseRepositoryConfig<TRow, TEntity, TCreate, TUpdate>): SupabaseRepository<TEntity, TCreate, TUpdate> {
  const fail = (operation: RepositoryOperation, error: PostgrestError, status: number): never => {
    throw new RepositoryError(table, operation, classify(error, status), error.code, error.message);
  };

  const ordered = <Q extends { order(column: string, options: { ascending: boolean }): Q }>(query: Q): Q =>
    orderBy ? query.order(orderBy.column, { ascending: orderBy.ascending }) : query;

  return {
    async create(input) {
      const { data, error, status } = await client.from(table).insert(toInsertRow(input)).select().single();
      if (error) fail('create', error, status);
      return toEntity(data as TRow);
    },

    async getAll() {
      const { data, error, status } = await ordered(client.from(table).select('*'));
      if (error) fail('getAll', error, status);
      return (data as TRow[]).map(toEntity);
    },

    async listWhere(column, value) {
      const { data, error, status } = await ordered(client.from(table).select('*').eq(column, value));
      if (error) fail('listWhere', error, status);
      return (data as TRow[]).map(toEntity);
    },

    async update(id, changes) {
      const { data, error, status } = await client
        .from(table)
        .update(toUpdateRow(changes))
        .eq(idColumn, id)
        .select()
        .single();
      if (error) fail('update', error, status);
      return toEntity(data as TRow);
    },

    // `lte` y no `lt`: reenviar el mismo cambio (si se perdió la respuesta) vuelve a aplicarse, no es un conflicto.
    async updateIfOlder(id, changes, at) {
      const { data, error, status } = await client
        .from(table)
        .update({ ...toUpdateRow(changes), [UPDATED_AT_COLUMN]: at })
        .eq(idColumn, id)
        .lte(UPDATED_AT_COLUMN, at)
        .select();
      if (error) fail('updateIfOlder', error, status);
      return (data as TRow[]).length > 0 ? 'applied' : 'stale';
    },

    async delete(id) {
      const { error, status } = await client.from(table).delete().eq(idColumn, id);
      if (error) fail('delete', error, status);
    },

    async deleteWhere(column, value) {
      const { error, status } = await client.from(table).delete().eq(column, value);
      if (error) fail('deleteWhere', error, status);
    },
  };
}
