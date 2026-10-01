import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateRoutineInput, Routine, UpdateRoutineInput } from '@/shared/types/routine.types';

import type { Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface RoutineRow {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  active: boolean;
  last_completed_at: string | null;
  created_at: string;
}

export type RoutineRepository = Repository<Routine, CreateRoutineInput, UpdateRoutineInput>;

const toEntity = (row: RoutineRow): Routine => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  active: row.active,
  lastCompletedAt: row.last_completed_at,
  createdAt: row.created_at,
});

// Las claves con valor undefined no se envían, así que sirve para insert y update.
const toRow = (input: UpdateRoutineInput) => ({
  name: input.name,
  icon: input.icon,
  color: input.color,
  active: input.active,
  last_completed_at: input.lastCompletedAt,
});

export function createRoutineRepository(client: SupabaseClient): RoutineRepository {
  return createSupabaseRepository<RoutineRow, Routine, CreateRoutineInput, UpdateRoutineInput>({
    client,
    table: 'routines',
    orderBy: { column: 'created_at', ascending: true },
    toEntity,
    toInsertRow: toRow,
    toUpdateRow: toRow,
  });
}
