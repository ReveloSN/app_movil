import type { SupabaseClient } from '@supabase/supabase-js';

import type { ForgotEvent } from '@/shared/types/forgot-event.types';

import { toRepositoryError } from './supabase.repository';

const TABLE = 'forgot_events';

interface ForgotEventRow {
  id: string;
  routine_id: string;
  record_id: string | null;
  label: string;
  date: string;
}

/** Olvidos en el servidor. Como las verificaciones, no se editan ni se borran uno a uno (los borra la cascada). */
export interface RemoteForgotEventRepository {
  /** Idempotente: si ya existe un olvido con ese id (un intento anterior llegó), no hace nada. */
  create(event: ForgotEvent): Promise<void>;
  /** Del más reciente al más antiguo. */
  getAll(): Promise<ForgotEvent[]>;
}

const toEntity = (row: ForgotEventRow): ForgotEvent => ({
  id: row.id,
  routineId: row.routine_id,
  recordId: row.record_id,
  label: row.label,
  date: row.date,
});

const toRow = (event: ForgotEvent): ForgotEventRow => ({
  id: event.id,
  routine_id: event.routineId,
  record_id: event.recordId,
  label: event.label,
  date: event.date,
});

export function createForgotEventRepository(client: SupabaseClient): RemoteForgotEventRepository {
  return {
    async create(event) {
      // ON CONFLICT (id) DO NOTHING: reintentar nunca duplica ni falla.
      const { error, status } = await client.from(TABLE).upsert(toRow(event), { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw toRepositoryError(TABLE, 'create', error, status);
    },

    async getAll() {
      const { data, error, status } = await client.from(TABLE).select('*').order('date', { ascending: false });
      if (error) throw toRepositoryError(TABLE, 'getAll', error, status);
      return (data as ForgotEventRow[]).map(toEntity);
    },
  };
}
