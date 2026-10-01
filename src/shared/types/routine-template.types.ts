import type { Json } from './json.types';

/** Entidad "Template" del modelo: plantilla predefinida de rutina. */
export interface RoutineTemplate {
  id: string;
  name: string;
  description: string | null;
  suggestedItems: Json;
  suggestedTrigger: string | null;
  category: string | null;
}

export interface CreateRoutineTemplateInput {
  name: string;
  suggestedItems: Json;
  description?: string | null;
  suggestedTrigger?: string | null;
  category?: string | null;
}

export type UpdateRoutineTemplateInput = Partial<CreateRoutineTemplateInput>;
