import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateHomeNetworkInput,
  HomeNetwork,
  UpdateHomeNetworkInput,
} from '@/shared/types/home-network.types';

import type { Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface HomeNetworkRow {
  id: string;
  user_id: string;
  display_name: string;
  ssid: string;
  place: string | null;
}

export type HomeNetworkRepository = Repository<HomeNetwork, CreateHomeNetworkInput, UpdateHomeNetworkInput>;

const toEntity = (row: HomeNetworkRow): HomeNetwork => ({
  id: row.id,
  userId: row.user_id,
  displayName: row.display_name,
  ssid: row.ssid,
  place: row.place,
});

const toRow = (input: UpdateHomeNetworkInput) => ({
  display_name: input.displayName,
  ssid: input.ssid,
  place: input.place,
});

export function createHomeNetworkRepository(client: SupabaseClient): HomeNetworkRepository {
  return createSupabaseRepository<HomeNetworkRow, HomeNetwork, CreateHomeNetworkInput, UpdateHomeNetworkInput>({
    client,
    table: 'home_networks',
    orderBy: { column: 'display_name', ascending: true },
    toEntity,
    toInsertRow: toRow,
    toUpdateRow: toRow,
  });
}
