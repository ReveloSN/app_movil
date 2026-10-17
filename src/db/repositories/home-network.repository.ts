import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateHomeNetworkInput,
  HomeNetwork,
  UpdateHomeNetworkInput,
} from '@/shared/types/home-network.types';

import type { LastWriteWins, Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface HomeNetworkRow {
  id: string;
  user_id: string;
  display_name: string;
  ssid: string;
  place: string | null;
  updated_at: string;
}

export type HomeNetworkRepository = Repository<HomeNetwork, CreateHomeNetworkInput, UpdateHomeNetworkInput>;
/** Lo que necesita la sincronización: además, la actualización "gana el más reciente". */
export type RemoteHomeNetworkRepository = HomeNetworkRepository & LastWriteWins<UpdateHomeNetworkInput>;

const toEntity = (row: HomeNetworkRow): HomeNetwork => ({
  id: row.id,
  userId: row.user_id,
  displayName: row.display_name,
  ssid: row.ssid,
  place: row.place,
  updatedAt: row.updated_at,
});

const toUpdateRow = (input: UpdateHomeNetworkInput) => ({
  display_name: input.displayName,
  ssid: input.ssid,
  place: input.place,
});

const toInsertRow = (input: CreateHomeNetworkInput) => ({
  id: input.id,
  ...toUpdateRow(input),
  updated_at: input.updatedAt,
});

export function createHomeNetworkRepository(client: SupabaseClient): RemoteHomeNetworkRepository {
  const { listWhere: _listWhere, deleteWhere: _deleteWhere, ...base } = createSupabaseRepository<
    HomeNetworkRow,
    HomeNetwork,
    CreateHomeNetworkInput,
    UpdateHomeNetworkInput
  >({
    client,
    table: 'home_networks',
    orderBy: { column: 'display_name', ascending: true },
    toEntity,
    toInsertRow,
    toUpdateRow,
  });
  return base;
}
