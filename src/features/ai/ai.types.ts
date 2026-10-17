// Respuesta de la Edge Function `ai-routine` (contrato en supabase/functions/ai-routine/contract.ts).
// La app la vuelve a validar (ai.draft.ts): lo que llega por la red nunca se usa tal cual.

export interface AiDraftItem {
  label: string;
  type: string;
  critical: boolean;
  note?: string;
}

export type AiDraftTrigger = { type: 'schedule'; time: string; days: number[] } | { type: 'wifi_exit' };

export interface AiDraft {
  name: string;
  icon: string;
  color: string;
  items: AiDraftItem[];
  trigger?: AiDraftTrigger;
}

export type AiRequest =
  | { mode: 'draft'; prompt: string }
  | { mode: 'suggest'; name: string; items: string[] };

/** Lo que la app distingue para orientar a la persona (ai.copy.ts tiene el texto de cada uno). */
export type AiErrorKind =
  | 'offline'
  | 'timeout'
  | 'quota_exceeded'
  | 'not_a_routine'
  | 'invalid_output'
  | 'invalid_input'
  | 'unauthorized'
  | 'server';

export class AiClientError extends Error {
  constructor(readonly kind: AiErrorKind) {
    super(`ai:${kind}`);
    this.name = 'AiClientError';
  }
}
