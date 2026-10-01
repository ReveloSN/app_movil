import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import { RepositoryError, type Repository, type RepositoryOperation } from './repository.types';

/** Valores de columna a escribir; las claves son nombres de columna en snake_case. */
type RowValues = Record<string, unknown>;

interface SupabaseRepositoryConfig<TRow, TEntity, TCreate, TUpdate> {
  client: SupabaseClient;
  table: string;
  /** Columna de clave primaria (por defecto `id`). */
  idColumn?: string;
  /** Orden por defecto de getAll. */
  orderBy?: { column: string; ascending: boolean };
  /** Mapeos fila de BD (snake_case) ⇄ entidad de dominio (camelCase). */
  toEntity(row: TRow): TEntity;
  toInsertRow(input: TCreate): RowValues;
  toUpdateRow(changes: TUpdate): RowValues;
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
}: SupabaseRepositoryConfig<TRow, TEntity, TCreate, TUpdate>): Repository<TEntity, TCreate, TUpdate> {
  const fail = (operation: RepositoryOperation, error: PostgrestError): never => {
    throw new RepositoryError(table, operation, error.code, error.message);
  };

  return {
    async create(input) {
      const { data, error } = await client.from(table).insert(toInsertRow(input)).select().single();
      if (error) fail('create', error);
      return toEntity(data as TRow);
    },

    async getAll() {
      let query = client.from(table).select('*');
      if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending });
      const { data, error } = await query;
      if (error) fail('getAll', error);
      return (data as TRow[]).map(toEntity);
    },

    async update(id, changes) {
      const { data, error } = await client
        .from(table)
        .update(toUpdateRow(changes))
        .eq(idColumn, id)
        .select()
        .single();
      if (error) fail('update', error);
      return toEntity(data as TRow);
    },

    async delete(id) {
      const { error } = await client.from(table).delete().eq(idColumn, id);
      if (error) fail('delete', error);
    },
  };
}
