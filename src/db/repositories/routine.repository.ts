import type { SupabaseClient } from '@supabase/supabase-js';

import {
  type CreateRoutineInput,
  type Routine,
  type RoutineKind,
  type UpdateRoutineInput,
} from '@/shared/types/routine.types';

import type { LastWriteWins, Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface RoutineRow {
  id: string;
  user_id: string;
  name: string;
  /**
   * Falta mientras la base no tenga la migración 20261103000000 (select * no la trae). En esa base,
   * un insert o update que lleve kind falla con PGRST204: la sincronización lo reintenta sin kind.
   */
  kind?: RoutineKind | null;
  icon: string | null;
  color: string | null;
  active: boolean;
  last_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RoutineRepository = Repository<Routine, CreateRoutineInput, UpdateRoutineInput>;

/**
 * Rutina como la devuelve el servidor. Sin kind si la base aún no tiene la columna: no se sabe el tipo
 * (no se asume 'departure'), así la sincronización conserva el que tiene el teléfono.
 */
export type RemoteRoutine = Omit<Routine, 'kind'> & { kind?: RoutineKind };

/** Lo que necesita la sincronización: además, la actualización "gana el más reciente". */
export type RemoteRoutineRepository = Repository<RemoteRoutine, CreateRoutineInput, UpdateRoutineInput> &
  LastWriteWins<UpdateRoutineInput>;

const toEntity = (row: RoutineRow): RemoteRoutine => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  ...(row.kind ? { kind: row.kind } : {}),
  icon: row.icon,
  color: row.color,
  active: row.active,
  lastCompletedAt: row.last_completed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Las claves con valor undefined no se envían, así que sirve para insert y update. kind va siempre que
// el input lo traiga: si la base no tiene la columna, el que lo maneja es la sincronización (sync.push).
const toUpdateRow = (input: UpdateRoutineInput) => ({
  name: input.name,
  kind: input.kind,
  icon: input.icon,
  color: input.color,
  active: input.active,
  last_completed_at: input.lastCompletedAt,
});

const toInsertRow = (input: CreateRoutineInput) => ({
  id: input.id,
  ...toUpdateRow(input),
  updated_at: input.updatedAt,
});

export function createRoutineRepository(client: SupabaseClient): RemoteRoutineRepository {
  const { listWhere: _listWhere, deleteWhere: _deleteWhere, ...base } = createSupabaseRepository<
    RoutineRow,
    RemoteRoutine,
    CreateRoutineInput,
    UpdateRoutineInput
  >({
    client,
    table: 'routines',
    orderBy: { column: 'created_at', ascending: true },
    toEntity,
    toInsertRow,
    toUpdateRow,
  });
  return base;
}
