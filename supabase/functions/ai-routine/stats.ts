// Modos con datos AGREGADOS (servidor): "insights" (un olvido que se repite) y "weekly_summary"
// (resumen de la semana). Nunca llega el historial completo: solo conteos y, como mucho, unas
// etiquetas de ítems, que son datos de la persona (se delimitan y se limitan como cualquier texto).
// Sin APIs de Deno.

import { AiError, INPUT_LIMITS, INSIGHT_SOURCES, type InsightSource } from './contract.ts';
import { cleanText, clip } from './text.ts';

export const STATS_LIMITS = {
  itemLabel: 32,
  routineName: 24,
  count: 500,
  streak: 366,
  topSkipped: 3,
  /** "Olvidé algo": la persona escribe la etiqueta (igual que el check de forgot_events.label). */
  forgotLabel: INPUT_LIMITS.forgotLabel,
  insightMessage: 140,
  summary: 280,
  recommendation: 140,
} as const;

export const INSIGHT_ACTIONS = ['mark_critical', 'add_item', 'none'] as const;
export type InsightAction = (typeof INSIGHT_ACTIONS)[number];

/** Ítem de la rutina que se omite al verificar (el cliente de siempre: sin `source`). */
export interface OmissionInsightPattern {
  source: 'omission';
  item: string;
  routine: string;
  /** 0 = domingo … 6 = sábado, o null si no es un patrón de día. */
  weekday: number | null;
  misses: number;
  observations: number;
  critical: boolean;
}

/** Ítem anotado con "Olvidé algo" que se repite el mismo día de la semana. */
export interface ForgotInsightPattern {
  source: 'forgot';
  label: string;
  routine: string;
  /** 0 = domingo … 6 = sábado. */
  weekday: number;
  /** Días con el olvido anotado y salidas ese día de la semana (lo calcula el teléfono). */
  misses: number;
  observations: number;
  /** Si el ítem ya está en la rutina (entonces se puede marcar como crítico; si no, agregar). */
  inRoutine: boolean;
  critical: boolean;
}

export interface InsightsRequest {
  mode: 'insights';
  pattern: OmissionInsightPattern | ForgotInsightPattern;
}

/** La acción la decide el dato, no el modelo: el modelo solo redacta el mensaje para esa acción. */
export function expectedInsightAction(pattern: InsightsRequest['pattern']): InsightAction {
  if (pattern.source === 'forgot' && !pattern.inRoutine) return 'add_item';
  return pattern.critical ? 'none' : 'mark_critical';
}

export interface WeeklyRequest {
  mode: 'weekly_summary';
  stats: {
    /** Lunes de la semana, "AAAA-MM-DD". */
    weekStart: string;
    completed: number;
    partial: number;
    skipped: number;
    streak: number;
    previousCompleted: number;
    topSkipped: { label: string; count: number }[];
    bestDay: number | null;
    worstDay: number | null;
  };
}

export interface Insight {
  message: string;
  action: InsightAction;
}

export interface WeeklySummary {
  resumen: string;
  recomendacion: string;
}

const fail = (message: string): never => {
  throw new AiError('invalid_input', message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function count(value: unknown, field: string, max: number = STATS_LIMITS.count): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) {
    return fail(`"${field}" debe ser un entero entre 0 y ${max}.`);
  }
  return value;
}

function weekday(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  return count(value, field, 6);
}

function label(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') return fail(`"${field}" debe ser texto.`);
  const text = cleanText(value);
  if (!text) fail(`"${field}" está vacío.`);
  if (text.length > max) fail(`"${field}" admite como máximo ${max} caracteres.`);
  return text;
}

function source(value: unknown): InsightSource {
  if (value === undefined || value === null) return 'omission'; // Compatible con la app que no lo envía.
  const known = INSIGHT_SOURCES.find((option) => option === value);
  return known ?? fail(`"pattern.source" debe ser ${INSIGHT_SOURCES.map((option) => `"${option}"`).join(' o ')}.`);
}

export function parseInsightsRequest(body: Record<string, unknown>): InsightsRequest {
  const pattern = body.pattern;
  if (!isRecord(pattern)) return fail('"pattern" debe ser un objeto.');
  const kind = source(pattern.source);
  const misses = count(pattern.misses, 'pattern.misses');
  const observations = count(pattern.observations, 'pattern.observations');
  if (misses < 1 || observations < misses) fail('"pattern" debe tener al menos una omisión y no más omisiones que verificaciones.');
  if (kind === 'forgot') {
    const day = weekday(pattern.weekday, 'pattern.weekday');
    if (day === null) return fail('Para un olvido, "pattern.weekday" es obligatorio (0 a 6).');
    const inRoutine = pattern.inRoutine === true;
    return {
      mode: 'insights',
      pattern: {
        source: 'forgot',
        label: label(pattern.label, 'pattern.label', STATS_LIMITS.forgotLabel),
        routine: label(pattern.routine, 'pattern.routine', STATS_LIMITS.routineName),
        weekday: day,
        misses,
        observations,
        inRoutine,
        // Lo que no está en la rutina no puede ser crítico.
        critical: inRoutine && pattern.critical === true,
      },
    };
  }
  return {
    mode: 'insights',
    pattern: {
      source: 'omission',
      item: label(pattern.item, 'pattern.item', STATS_LIMITS.itemLabel),
      routine: label(pattern.routine, 'pattern.routine', STATS_LIMITS.routineName),
      weekday: weekday(pattern.weekday, 'pattern.weekday'),
      misses,
      observations,
      critical: pattern.critical === true,
    },
  };
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseWeeklyRequest(body: Record<string, unknown>): WeeklyRequest {
  const stats = body.stats;
  if (!isRecord(stats)) return fail('"stats" debe ser un objeto.');
  if (typeof stats.weekStart !== 'string' || !ISO_DAY.test(stats.weekStart)) fail('"stats.weekStart" debe ser una fecha AAAA-MM-DD.');
  const top = stats.topSkipped ?? [];
  if (!Array.isArray(top) || top.length > STATS_LIMITS.topSkipped) fail(`"stats.topSkipped" admite como máximo ${STATS_LIMITS.topSkipped} ítems.`);
  return {
    mode: 'weekly_summary',
    stats: {
      weekStart: stats.weekStart as string,
      completed: count(stats.completed, 'stats.completed'),
      partial: count(stats.partial, 'stats.partial'),
      skipped: count(stats.skipped, 'stats.skipped'),
      streak: count(stats.streak, 'stats.streak', STATS_LIMITS.streak),
      previousCompleted: count(stats.previousCompleted, 'stats.previousCompleted'),
      topSkipped: (top as unknown[]).map((entry, index) => {
        if (!isRecord(entry)) return fail(`"stats.topSkipped[${index}]" debe ser un objeto.`);
        return {
          label: label(entry.label, `stats.topSkipped[${index}].label`, STATS_LIMITS.itemLabel),
          count: count(entry.count, `stats.topSkipped[${index}].count`),
        };
      }),
      bestDay: weekday(stats.bestDay, 'stats.bestDay'),
      worstDay: weekday(stats.worstDay, 'stats.worstDay'),
    },
  };
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Neutraliza lo que podría cerrar el delimitador de datos. */
const neutral = (text: string) => text.replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim();
const data = (text: string) => `<datos_usuario>${neutral(text)}</datos_usuario>`;

export const INSIGHTS_RULES = `Tarea: SOLO redactas UNA sugerencia breve para alguien que suele olvidar un ítem. El patrón, los conteos y la acción ya están calculados: no calcules, no deduzcas ni inventes datos; usa solo los dados.
- En español, con tuteo, sin culpa ni regaños, sin emojis y sin signos de exclamación.
- "message": máximo ${STATS_LIMITS.insightMessage} caracteres, que mencione el ítem entre comillas angulares « » (y el día, si lo hay) y termine proponiendo la acción indicada.
  Ejemplos: "Sueles omitir «Cargador». ¿Lo marcamos como crítico?", "Olvidas las «Llaves» los lunes. ¿Las agregamos a tu rutina?".
- "action": exactamente la de "Acción indicada" ("mark_critical" = marcarlo como crítico, "add_item" = agregarlo a la rutina, "none" = ninguna).
- No incluyas enlaces ni direcciones web.`;

export const WEEKLY_RULES = `Tarea: resume la semana de verificaciones de la persona.
- "resumen": máximo ${STATS_LIMITS.summary} caracteres; qué tal fue la semana comparada con la anterior, sin culpa.
- "recomendacion": máximo ${STATS_LIMITS.recommendation} caracteres; UNA acción concreta y pequeña para la semana que viene.
- Tuteo, sin emojis, sin signos de exclamación, sin enlaces. No inventes datos: usa solo los dados.`;

export function insightsUserMessage({ pattern }: InsightsRequest): string {
  const when = pattern.weekday === null ? 'en general' : `los ${DAY_NAMES[pattern.weekday]}`;
  const action = `Acción indicada: ${expectedInsightAction(pattern)}.`;
  if (pattern.source === 'forgot') {
    return [
      'Origen: ítems que la persona anotó con "Olvidé algo" después de salir.',
      `Ítem olvidado: ${data(pattern.label)}`,
      `Rutina: ${data(pattern.routine)}`,
      `Cuándo: ${when}`,
      `Olvidado ${pattern.misses} de sus ${pattern.observations} salidas de ese día en las últimas 8 semanas.`,
      `Está en la rutina: ${pattern.inRoutine ? 'sí' : 'no'}. Ya es crítico: ${pattern.critical ? 'sí' : 'no'}.`,
      action,
    ].join('\n');
  }
  return [
    `Ítem: ${data(pattern.item)}`,
    `Rutina: ${data(pattern.routine)}`,
    `Cuándo: ${when}`,
    `Omitido ${pattern.misses} de ${pattern.observations} verificaciones.`,
    `Ya es crítico: ${pattern.critical ? 'sí' : 'no'}.`,
    action,
  ].join('\n');
}

export function weeklyUserMessage({ stats }: WeeklyRequest): string {
  const top = stats.topSkipped.length > 0 ? stats.topSkipped.map((item) => `${data(item.label)} (${item.count})`).join(', ') : 'ninguno';
  const day = (value: number | null) => (value === null ? 'sin datos' : DAY_NAMES[value]);
  return [
    `Semana que empieza el ${stats.weekStart}.`,
    `Completas: ${stats.completed}. Parciales: ${stats.partial}. Omitidas ("hoy no salgo"): ${stats.skipped}.`,
    `Completas la semana anterior: ${stats.previousCompleted}. Racha actual: ${stats.streak} días.`,
    `Ítems más omitidos: ${top}.`,
    `Mejor día: ${day(stats.bestDay)}. Día más difícil: ${day(stats.worstDay)}.`,
  ].join('\n');
}

export const INSIGHTS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    message: { type: 'STRING' },
    action: { type: 'STRING', enum: [...INSIGHT_ACTIONS] },
  },
  required: ['message', 'action'],
};

export const WEEKLY_SCHEMA = {
  type: 'OBJECT',
  properties: { resumen: { type: 'STRING' }, recomendacion: { type: 'STRING' } },
  required: ['resumen', 'recomendacion'],
};

const URL_LIKE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|co|io|ly)\b)/i;

/** Texto de salida limpio y acotado; sin enlaces (la app lo muestra tal cual en una tarjeta). */
function outputText(value: unknown, max: number, field: string): string {
  const text = typeof value === 'string' ? clip(cleanText(value), max) : '';
  if (!text) throw new AiError('invalid_output', `La respuesta no trae "${field}".`);
  if (URL_LIKE.test(text)) throw new AiError('invalid_output', `"${field}" trae un enlace.`);
  return text;
}

/** Mensaje limpio; la acción solo pasa si es la que corresponde al patrón (si el modelo se desvía, "none"). */
export function sanitizeInsight(raw: Record<string, unknown>, request: InsightsRequest): Insight {
  const expected = expectedInsightAction(request.pattern);
  const action: InsightAction = raw.action === expected ? expected : 'none';
  return { message: outputText(raw.message, STATS_LIMITS.insightMessage, 'message'), action };
}

export function sanitizeWeekly(raw: Record<string, unknown>): WeeklySummary {
  return {
    resumen: outputText(raw.resumen, STATS_LIMITS.summary, 'resumen'),
    recomendacion: outputText(raw.recomendacion, STATS_LIMITS.recommendation, 'recomendacion'),
  };
}
