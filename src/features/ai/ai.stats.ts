// Modos de IA con estadísticas agregadas: "insights" y "weekly_summary" (contrato en
// supabase/functions/ai-routine/stats.ts). La app vuelve a validar lo que llega: nunca se usa tal cual.

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { AiClient } from './ai.client';
import { AiClientError } from './ai.types';

/** Los mismos límites del servidor (un test lo comprueba). */
export const AI_STATS_LIMITS = { insightMessage: 160, summary: 280, recommendation: 140, itemLabel: 32, routineName: 24 } as const;

export interface InsightPatternInput {
  item: string;
  routine: string;
  weekday: number | null;
  misses: number;
  observations: number;
  critical: boolean;
}

export interface WeeklyStatsInput {
  weekStart: string;
  completed: number;
  partial: number;
  skipped: number;
  streak: number;
  previousCompleted: number;
  topSkipped: { label: string; count: number }[];
  bestDay: number | null;
  worstDay: number | null;
}

export interface AiInsight {
  message: string;
  action: 'mark_critical' | 'none';
}

export interface AiWeeklySummary {
  resumen: string;
  recomendacion: string;
}

const URL_LIKE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|co|io|ly)\b)/i;
const CONTROL = /[\u0000-\u001f\u007f]/g;

/** Texto de la IA apto para mostrarse: limpio, acotado y sin enlaces; si no, la respuesta no sirve. */
function shownText(value: unknown, max: number): string {
  if (typeof value !== 'string') throw new AiClientError('invalid_output');
  const text = value.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
  if (!text || text.length > max || URL_LIKE.test(text)) throw new AiClientError('invalid_output');
  return text;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function toInsight(data: unknown): AiInsight {
  const insight = isRecord(data) && data.mode === 'insights' && isRecord(data.insight) ? data.insight : null;
  if (!insight) throw new AiClientError('invalid_output');
  return {
    message: shownText(insight.message, AI_STATS_LIMITS.insightMessage),
    action: insight.action === 'mark_critical' ? 'mark_critical' : 'none',
  };
}

export function toWeeklySummary(data: unknown): AiWeeklySummary {
  const summary = isRecord(data) && data.mode === 'weekly_summary' && isRecord(data.summary) ? data.summary : null;
  if (!summary) throw new AiClientError('invalid_output');
  return {
    resumen: shownText(summary.resumen, AI_STATS_LIMITS.summary),
    recomendacion: shownText(summary.recomendacion, AI_STATS_LIMITS.recommendation),
  };
}

/** Recorta las etiquetas a los límites del servidor (son datos de la persona, nunca instrucciones). */
const fit = (text: string, max: number) => text.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// Caché persistente de insights por hash del patrón: el mismo patrón no vuelve a gastar cuota.
const INSIGHT_CACHE_KEY = 'ai-insights-cache';
const INSIGHT_CACHE_LIMIT = 50;

/** Hash corto y estable (FNV-1a de 32 bits) de los datos que se envían. */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export async function requestInsight(
  input: InsightPatternInput,
  { client, storage = AsyncStorage }: { client: AiClient; storage?: KeyValueStorage },
): Promise<AiInsight> {
  const pattern = { ...input, item: fit(input.item, AI_STATS_LIMITS.itemLabel), routine: fit(input.routine, AI_STATS_LIMITS.routineName) };
  const key = hashText(JSON.stringify(pattern));
  let cache: Record<string, AiInsight> = {};
  try {
    cache = JSON.parse((await storage.getItem(INSIGHT_CACHE_KEY)) ?? '{}') as Record<string, AiInsight>;
    if (cache[key]) return toInsight({ mode: 'insights', insight: cache[key] });
  } catch {
    cache = {};
  }
  const insight = toInsight(await client({ mode: 'insights', pattern }));
  const keys = Object.keys(cache).filter((existing) => existing !== key).slice(-(INSIGHT_CACHE_LIMIT - 1));
  const next = Object.fromEntries([...keys.map((existing) => [existing, cache[existing]] as const), [key, insight] as const]);
  await storage.setItem(INSIGHT_CACHE_KEY, JSON.stringify(next)).catch((cause: unknown) => {
    if (__DEV__) console.warn('[ai.insights.cache]', cause);
  });
  return insight;
}

export async function requestWeeklySummary(stats: WeeklyStatsInput, client: AiClient): Promise<AiWeeklySummary> {
  const payload = { ...stats, topSkipped: stats.topSkipped.slice(0, 3).map((item) => ({ ...item, label: fit(item.label, AI_STATS_LIMITS.itemLabel) })) };
  return toWeeklySummary(await client({ mode: 'weekly_summary', stats: payload }));
}
