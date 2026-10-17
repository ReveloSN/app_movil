import type { AiRoutineSeed } from './ai.draft';

// Borradores de IA en memoria, para pasarlos de "Crear con IA" a P04 sin meterlos en la URL.
// Son pocos por sesión y no se guardan: si la app se cierra, se pierden (aún no eran rutina).
const seeds = new Map<string, AiRoutineSeed>();
let counter = 0;

export function putAiDraft(seed: AiRoutineSeed): string {
  counter += 1;
  const id = `ai-${counter}`;
  seeds.set(id, seed);
  return id;
}

export const getAiDraft = (id: string | undefined): AiRoutineSeed | undefined => (id ? seeds.get(id) : undefined);
