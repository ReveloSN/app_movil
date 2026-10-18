import { supabase } from '@/shared/lib/supabase';

import { createAiClient, type AiClient } from './ai.client';
import { toRoutineSeed, toSuggestions, type AiRoutineSeed } from './ai.draft';
import {
  requestInsight,
  requestWeeklySummary,
  type AiInsight,
  type AiWeeklySummary,
  type InsightPatternInput,
  type WeeklyStatsInput,
} from './ai.stats';
import { sessionSuggestionCache, type SuggestionCache } from './suggestion.cache';

/** Cliente real: la Edge Function `ai-routine` con el JWT de la sesión (supabase-js lo agrega). */
const defaultClient: AiClient = createAiClient((name, options) => supabase.functions.invoke(name, options));

/** Borrador de rutina a partir de una frase (validado de nuevo en el teléfono). */
export async function requestRoutineDraft(prompt: string, client: AiClient = defaultClient): Promise<AiRoutineSeed> {
  return toRoutineSeed(await client({ mode: 'draft', prompt: prompt.trim() }));
}

/** Hasta 4 ítems que le faltan a la rutina. La misma rutina no repite la llamada en la sesión. */
export async function requestItemSuggestions(
  name: string,
  items: readonly string[],
  client: AiClient = defaultClient,
  cache: SuggestionCache = sessionSuggestionCache,
): Promise<string[]> {
  const cached = cache.get(name, items);
  if (cached) return cached;
  const suggestions = toSuggestions(await client({ mode: 'suggest', name: name.trim(), items: [...items] }), items);
  cache.set(name, items, suggestions);
  return suggestions;
}

/** Mensaje de un olvido que se repite (datos agregados), cacheado por patrón. */
export const requestPatternInsight = (pattern: InsightPatternInput, client: AiClient = defaultClient): Promise<AiInsight> =>
  requestInsight(pattern, { client });

/** Resumen de la semana a partir de estadísticas agregadas (lo pide la persona). */
export const requestWeekSummary = (stats: WeeklyStatsInput, client: AiClient = defaultClient): Promise<AiWeeklySummary> =>
  requestWeeklySummary(stats, client);
