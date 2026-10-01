import type { SupabaseClient } from '@supabase/supabase-js';

import type { Json } from '@/shared/types/json.types';
import type {
  CreateVerificationRecordInput,
  UpdateVerificationRecordInput,
  VerificationRecord,
} from '@/shared/types/verification-record.types';

import type { Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface RecordRow {
  id: string;
  routine_id: string;
  date: string;
  result: string;
  items_checked: Json | null;
  duration_seconds: number | null;
}

export type VerificationRecordRepository = Repository<
  VerificationRecord,
  CreateVerificationRecordInput,
  UpdateVerificationRecordInput
>;

const toEntity = (row: RecordRow): VerificationRecord => ({
  id: row.id,
  routineId: row.routine_id,
  date: row.date,
  result: row.result,
  itemsChecked: row.items_checked,
  durationSeconds: row.duration_seconds,
});

const toUpdateRow = (changes: UpdateVerificationRecordInput) => ({
  date: changes.date,
  result: changes.result,
  items_checked: changes.itemsChecked,
  duration_seconds: changes.durationSeconds,
});

const toInsertRow = (input: CreateVerificationRecordInput) => ({ routine_id: input.routineId, ...toUpdateRow(input) });

export function createVerificationRecordRepository(client: SupabaseClient): VerificationRecordRepository {
  return createSupabaseRepository<
    RecordRow,
    VerificationRecord,
    CreateVerificationRecordInput,
    UpdateVerificationRecordInput
  >({
    client,
    table: 'records',
    // Historial: lo más reciente primero.
    orderBy: { column: 'date', ascending: false },
    toEntity,
    toInsertRow,
    toUpdateRow,
  });
}
