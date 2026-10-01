import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateTriggerInput, Trigger, UpdateTriggerInput } from '@/shared/types/trigger.types';

import type { Repository } from './repository.types';
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
}

export type TriggerRepository = Repository<Trigger, CreateTriggerInput, UpdateTriggerInput>;

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

const toInsertRow = (input: CreateTriggerInput) => ({ routine_id: input.routineId, ...toUpdateRow(input) });

export function createTriggerRepository(client: SupabaseClient): TriggerRepository {
  return createSupabaseRepository<TriggerRow, Trigger, CreateTriggerInput, UpdateTriggerInput>({
    client,
    table: 'triggers',
    toEntity,
    toInsertRow,
    toUpdateRow,
  });
}
