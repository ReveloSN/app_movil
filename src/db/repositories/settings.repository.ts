import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateSettingsInput, Settings, UpdateSettingsInput } from '@/shared/types/settings.types';

import type { LastWriteWins, Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface SettingsRow {
  user_id: string;
  do_not_disturb: boolean;
  snooze_minutes: number;
  sound: boolean;
  /** Migración 20261017000000; falta en una base sin aplicarla. */
  display_name?: string | null;
  updated_at: string;
}

/** El id de update/delete es el userId. getAll devuelve como máximo una fila (la del usuario, por RLS). */
export type SettingsRepository = Repository<Settings, CreateSettingsInput, UpdateSettingsInput>;
/** Lo que necesita la sincronización: además, la actualización "gana el más reciente". */
export type RemoteSettingsRepository = SettingsRepository & LastWriteWins<UpdateSettingsInput>;

const toEntity = (row: SettingsRow): Settings => ({
  userId: row.user_id,
  doNotDisturb: row.do_not_disturb,
  snoozeMinutes: row.snooze_minutes,
  sound: row.sound,
  displayName: row.display_name ?? null,
  updatedAt: row.updated_at,
});

const toUpdateRow = (input: UpdateSettingsInput) => ({
  do_not_disturb: input.doNotDisturb,
  snooze_minutes: input.snoozeMinutes,
  sound: input.sound,
  display_name: input.displayName,
});

const toInsertRow = (input: CreateSettingsInput) => ({ ...toUpdateRow(input), updated_at: input.updatedAt });

export function createSettingsRepository(client: SupabaseClient): RemoteSettingsRepository {
  const { listWhere: _listWhere, deleteWhere: _deleteWhere, ...base } = createSupabaseRepository<
    SettingsRow,
    Settings,
    CreateSettingsInput,
    UpdateSettingsInput
  >({
    client,
    table: 'settings',
    idColumn: 'user_id',
    toEntity,
    toInsertRow,
    toUpdateRow,
  });
  return base;
}
