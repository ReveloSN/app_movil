import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateItemInput, Item, UpdateItemInput } from '@/shared/types/item.types';

import type { Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface ItemRow {
  id: string;
  routine_id: string;
  label: string;
  icon: string | null;
  type: string | null;
  critical: boolean;
  note: string | null;
  sort_order: number;
}

export interface ItemRepository extends Repository<Item, CreateItemInput, UpdateItemInput> {
  /** Ítems de una rutina, en su orden (sort_order). */
  getByRoutine(routineId: string): Promise<Item[]>;
  deleteByRoutine(routineId: string): Promise<void>;
}

const toEntity = (row: ItemRow): Item => ({
  id: row.id,
  routineId: row.routine_id,
  label: row.label,
  icon: row.icon,
  type: row.type,
  critical: row.critical,
  note: row.note,
  sortOrder: row.sort_order,
});

const toUpdateRow = (changes: UpdateItemInput) => ({
  label: changes.label,
  icon: changes.icon,
  type: changes.type,
  critical: changes.critical,
  note: changes.note,
  sort_order: changes.sortOrder,
});

const toInsertRow = (input: CreateItemInput) => ({ routine_id: input.routineId, ...toUpdateRow(input) });

export function createItemRepository(client: SupabaseClient): ItemRepository {
  const { listWhere, deleteWhere, ...base } = createSupabaseRepository<ItemRow, Item, CreateItemInput, UpdateItemInput>({
    client,
    table: 'items',
    orderBy: { column: 'sort_order', ascending: true },
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
