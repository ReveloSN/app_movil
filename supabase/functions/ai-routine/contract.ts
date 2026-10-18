// Contrato de la Edge Function `ai-routine`: límites, conjuntos cerrados y errores.
// Sin APIs de Deno ni imports npm:/jsr:, para probarlo con Jest desde la app.

import type { Insight, InsightsRequest, WeeklyRequest, WeeklySummary } from './stats.ts';

/** Límites de entrada (los mismos de la app: docs/ux/01-contenido.md §03). */
export const INPUT_LIMITS = {
  prompt: 200,
  name: 24,
  items: 12,
  itemLabel: 32,
} as const;

/** Límites de salida. Un borrador trae menos ítems que el máximo de una rutina (lista corta). */
export const OUTPUT_LIMITS = {
  name: 24,
  draftItemsMin: 1,
  draftItemsMax: 8,
  itemLabel: 32,
  itemNote: 60,
  suggestions: 4,
} as const;

/** Mismo conjunto que src/features/routines/routine-appearance.ts (un test lo comprueba). */
export const ROUTINE_ICONS = [
  'checkbox-outline',
  'home-outline',
  'briefcase-outline',
  'school-outline',
  'moon-outline',
  'airplane-outline',
  'barbell-outline',
  'cart-outline',
  'paw-outline',
  'car-outline',
] as const;
export const ROUTINE_COLORS = ['green', 'blue', 'amber', 'purple', 'gray'] as const;
export const DEFAULT_ICON: RoutineIcon = 'checkbox-outline';
export const DEFAULT_COLOR: RoutineColor = 'green';

/** Valores de items.type: llevar, hacer, comprobar. */
export const ITEM_TYPES = ['carry', 'do', 'check'] as const;

export type RoutineIcon = (typeof ROUTINE_ICONS)[number];
export type RoutineColor = (typeof ROUTINE_COLORS)[number];
export type ItemType = (typeof ITEM_TYPES)[number];
export type AiMode = 'draft' | 'suggest' | 'insights' | 'weekly_summary';

export interface DraftRequest {
  mode: 'draft';
  prompt: string;
}

export interface SuggestRequest {
  mode: 'suggest';
  name: string;
  items: string[];
}

export type AiRequest = DraftRequest | SuggestRequest | InsightsRequest | WeeklyRequest;

export interface DraftItem {
  label: string;
  type: ItemType;
  critical: boolean;
  note?: string;
}

/** 0 = domingo … 6 = sábado (como triggers.days). */
export type DraftTrigger = { type: 'schedule'; time: string; days: number[] } | { type: 'wifi_exit' };

export interface RoutineDraft {
  name: string;
  icon: RoutineIcon;
  color: RoutineColor;
  items: DraftItem[];
  trigger?: DraftTrigger;
}

export type AiResponse =
  | { mode: 'draft'; draft: RoutineDraft }
  | { mode: 'suggest'; suggestions: string[] }
  | { mode: 'insights'; insight: Insight }
  | { mode: 'weekly_summary'; summary: WeeklySummary };

/** Códigos de error que la app interpreta (src/features/ai/ai.errors.ts). */
export type AiErrorCode =
  | 'invalid_input'
  | 'unauthorized'
  | 'quota_exceeded'
  | 'not_a_routine'
  | 'invalid_output'
  | 'provider_timeout'
  | 'provider_error'
  | 'server_misconfigured'
  | 'method_not_allowed'
  | 'server_error';

export const ERROR_STATUS: Record<AiErrorCode, number> = {
  invalid_input: 400,
  unauthorized: 401,
  method_not_allowed: 405,
  not_a_routine: 422,
  quota_exceeded: 429,
  server_error: 500,
  server_misconfigured: 500,
  invalid_output: 502,
  provider_error: 502,
  provider_timeout: 504,
};

export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export interface ErrorBody {
  error: { code: AiErrorCode; message: string };
}
