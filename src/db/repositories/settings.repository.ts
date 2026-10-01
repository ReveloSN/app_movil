import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateSettingsInput, Settings, UpdateSettingsInput } from '@/shared/types/settings.types';

import type { Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface SettingsRow {
  user_id: string;
  do_not_disturb: boolean;
  snooze_minutes: number;
  sound: boolean;
}

/** El id de update/delete es el userId. getAll devuelve como máximo una fila (la del usuario, por RLS). */
export type SettingsRepository = Repository<Settings, CreateSettingsInput, UpdateSettingsInput>;

const toEntity = (row: SettingsRow): Settings => ({
  userId: row.user_id,
  doNotDisturb: row.do_not_disturb,
  snoozeMinutes: row.snooze_minutes,
  sound: row.sound,
});

const toRow = (input: UpdateSettingsInput) => ({
  do_not_disturb: input.doNotDisturb,
  snooze_minutes: input.snoozeMinutes,
  sound: input.sound,
});

export function createSettingsRepository(client: SupabaseClient): SettingsRepository {
  return createSupabaseRepository<SettingsRow, Settings, CreateSettingsInput, UpdateSettingsInput>({
    client,
    table: 'settings',
    idColumn: 'user_id',
    toEntity,
    toInsertRow: toRow,
    toUpdateRow: toRow,
  });
}
