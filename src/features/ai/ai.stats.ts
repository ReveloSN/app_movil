// Modos de IA con estadísticas agregadas: "insights" y "weekly_summary" (contrato en
// supabase/functions/ai-routine/stats.ts). La app vuelve a validar lo que llega: nunca se usa tal cual.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { localDayNumber } from '@/features/history/history.streak';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { AiClient } from './ai.client';
import { AiClientError } from './ai.types';

/** Los mismos límites del servidor (un test lo comprueba). */
export const AI_STATS_LIMITS = {
  insightMessage: 140,
  summary: 280,
  recommendation: 140,
  itemLabel: 32,
  forgotLabel: 60,
  routineName: 24,
} as const;

/** Ítem que se omite al verificar. Sin `source`: así lo entiende también el servidor anterior. */
export interface OmissionPatternInput {
  source?: 'omission';
  item: string;
  routine: string;
  weekday: number | null;
  misses: number;
  observations: number;
  critical: boolean;
}

/** Ítem anotado con "Olvidé algo" que se repite el mismo día de la semana. */
export interface ForgotPatternInput {
  source: 'forgot';
  label: string;
  routine: string;
  weekday: number;
  misses: number;
  observations: number;
  inRoutine: boolean;
  critical: boolean;
}

export type InsightPatternInput = OmissionPatternInput | ForgotPatternInput;

export type InsightAction = 'mark_critical' | 'add_item' | 'none';

/** La acción que corresponde al patrón (la misma regla que el servidor): la IA solo redacta. */
export function expectedInsightAction(pattern: InsightPatternInput): InsightAction {
  if (pattern.source === 'forgot' && !pattern.inRoutine) return 'add_item';
  return pattern.critical ? 'none' : 'mark_critical';
}

/** Tramos de omisiones/olvidos: dentro del mismo tramo el texto no cambia y no se vuelve a pedir. */
export const missesBucket = (misses: number): '3-4' | '5-9' | '10+' => (misses >= 10 ? '10+' : misses >= 5 ? '5-9' : '3-4');

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
  action: InsightAction;
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
    action: insight.action === 'mark_critical' || insight.action === 'add_item' ? insight.action : 'none',
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

// Caché persistente de insights: el mismo patrón en el mismo tramo no vuelve a gastar cuota.
const INSIGHT_CACHE_KEY = 'ai-insights-cache';
const INSIGHT_CACHE_LIMIT = 50;
/** Día local en que el servidor dijo "sin cuota": ese día no se vuelve a intentar un insight. */
const INSIGHT_BLOCKED_KEY = 'ai-insights-quota-day';

/** Hash corto y estable (FNV-1a de 32 bits) de los datos que se envían. */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Lo que viaja: etiquetas recortadas a los límites del servidor. */
function payloadOf(input: InsightPatternInput): InsightPatternInput {
  const routine = fit(input.routine, AI_STATS_LIMITS.routineName);
  if (input.source === 'forgot') return { ...input, routine, label: fit(input.label, AI_STATS_LIMITS.forgotLabel) };
  return { ...input, routine, item: fit(input.item, AI_STATS_LIMITS.itemLabel) };
}

/**
 * Clave de caché: origen + patrón + tramo de omisiones (+ la acción esperada, para no mostrar "¿Lo
 * agregamos?" de un ítem que ya se agregó). `patternId` es la clave estable del patrón (patternKey); si no
 * se da, se usa la rutina, la etiqueta y el día.
 */
export function insightCacheKey(input: InsightPatternInput, patternId?: string): string {
  const label = input.source === 'forgot' ? input.label : input.item;
  const id = patternId ?? [input.routine, label.trim().toLocaleLowerCase('es'), input.weekday ?? ''].join('|');
  return hashText([input.source ?? 'omission', id, missesBucket(input.misses), expectedInsightAction(input)].join('|'));
}

interface InsightOptions {
  client: AiClient;
  storage?: KeyValueStorage;
  patternId?: string;
  now?: () => number;
}

/**
 * Mensaje de la IA para un patrón ya detectado en el teléfono. Una sola llamada como mucho; ninguna si
 * está en caché o si hoy el servidor ya dijo que no hay cuota (lanza quota_exceeded sin llamar).
 */
export async function requestInsight(
  input: InsightPatternInput,
  { client, storage = AsyncStorage, patternId, now = Date.now }: InsightOptions,
): Promise<AiInsight> {
  const pattern = payloadOf(input);
  const key = insightCacheKey(pattern, patternId);
  let cache: Record<string, AiInsight> = {};
  try {
    cache = JSON.parse((await storage.getItem(INSIGHT_CACHE_KEY)) ?? '{}') as Record<string, AiInsight>;
    if (cache[key]) return toInsight({ mode: 'insights', insight: cache[key] });
  } catch {
    cache = {};
  }
  const today = String(localDayNumber(now()));
  if ((await storage.getItem(INSIGHT_BLOCKED_KEY).catch(() => null)) === today) throw new AiClientError('quota_exceeded');
  let insight: AiInsight;
  try {
    insight = toInsight(await client({ mode: 'insights', pattern }));
  } catch (cause) {
    if (cause instanceof AiClientError && cause.kind === 'quota_exceeded') {
      await storage.setItem(INSIGHT_BLOCKED_KEY, today).catch(() => undefined);
    }
    throw cause;
  }
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
