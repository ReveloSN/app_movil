import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateTriggerInput, Trigger, UpdateTriggerInput } from '@/shared/types/trigger.types';

import type { LastWriteWins, Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface TriggerRow {
  id: string;
  routine_id: string;
  type: string;
  time: string | null;
  days: number[] | null;
  network_id: string | null;
  window_start: string | null;
  window_end: string | null;
  active: boolean;
  updated_at: string;
}

export interface TriggerRepository extends Repository<Trigger, CreateTriggerInput, UpdateTriggerInput> {
  /** Avisos de una rutina (0–3). */
  getByRoutine(routineId: string): Promise<Trigger[]>;
  deleteByRoutine(routineId: string): Promise<void>;
}
/** Lo que necesita la sincronización: además, la actualización "gana el más reciente". */
export type RemoteTriggerRepository = TriggerRepository & LastWriteWins<UpdateTriggerInput>;

const toEntity = (row: TriggerRow): Trigger => ({
  id: row.id,
  routineId: row.routine_id,
  type: row.type,
  time: row.time,
  days: row.days,
  networkId: row.network_id,
  windowStart: row.window_start,
  windowEnd: row.window_end,
  active: row.active,
  updatedAt: row.updated_at,
});

const toUpdateRow = (changes: UpdateTriggerInput) => ({
  type: changes.type,
  time: changes.time,
  days: changes.days,
  network_id: changes.networkId,
  window_start: changes.windowStart,
  window_end: changes.windowEnd,
  active: changes.active,
});

const toInsertRow = (input: CreateTriggerInput) => ({
  id: input.id,
  routine_id: input.routineId,
  ...toUpdateRow(input),
  updated_at: input.updatedAt,
});

export function createTriggerRepository(client: SupabaseClient): RemoteTriggerRepository {
  const { listWhere, deleteWhere, ...base } = createSupabaseRepository<
    TriggerRow,
    Trigger,
    CreateTriggerInput,
    UpdateTriggerInput
  >({
    client,
    table: 'triggers',
    toEntity,
    toInsertRow,
    toUpdateRow,
  });

  return {
    ...base,
    getByRoutine: (routineId) => listWhere('routine_id', routineId),
    deleteByRoutine: (routineId) => deleteWhere('routine_id', routineId),
  };
}
