import type { SupabaseClient } from '@supabase/supabase-js';

import type { Json } from '@/shared/types/json.types';
import type {
  CreateRoutineTemplateInput,
  RoutineTemplate,
  UpdateRoutineTemplateInput,
} from '@/shared/types/routine-template.types';

import type { Repository } from './repository.types';
import { createSupabaseRepository } from './supabase.repository';

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  suggested_items: Json;
  suggested_trigger: string | null;
  category: string | null;
}

export type RoutineTemplateRepository = Repository<
  RoutineTemplate,
  CreateRoutineTemplateInput,
  UpdateRoutineTemplateInput
>;

const toEntity = (row: TemplateRow): RoutineTemplate => ({
  id: row.id,
  name: row.name,
  description: row.description,
  suggestedItems: row.suggested_items,
  suggestedTrigger: row.suggested_trigger,
  category: row.category,
});

const toRow = (input: UpdateRoutineTemplateInput) => ({
  name: input.name,
  description: input.description,
  suggested_items: input.suggestedItems,
  suggested_trigger: input.suggestedTrigger,
  category: input.category,
});

// Las plantillas son globales (sin user_id); las escrituras dependen de lo que permita RLS.
export function createRoutineTemplateRepository(client: SupabaseClient): RoutineTemplateRepository {
  return createSupabaseRepository<TemplateRow, RoutineTemplate, CreateRoutineTemplateInput, UpdateRoutineTemplateInput>({
    client,
    table: 'templates',
    orderBy: { column: 'name', ascending: true },
    toEntity,
    toInsertRow: toRow,
    toUpdateRow: toRow,
  });
}
