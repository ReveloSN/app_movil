import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { WeekSummaryText } from './weekly';

export interface StoredWeekSummary extends WeekSummaryText {
  /** "ai" si lo redactó la IA; "local" si es el resumen automático (sin IA). */
  source: 'ai' | 'local';
  /** ISO 8601. */
  createdAt: string;
}

const KEEP_WEEKS = 12;

/**
 * Resúmenes guardados en el teléfono por semana (clave = lunes "AAAA-MM-DD"): se ven sin conexión y sin
 * volver a gastar cuota. Solo de este dispositivo; se guardan las últimas 12 semanas.
 */
export function createWeeklySummaryStore(userId: string, storage: KeyValueStorage = AsyncStorage) {
  const key = `weekly-summary:${userId}`;
  const readAll = async (): Promise<Record<string, StoredWeekSummary>> => {
    try {
      const parsed: unknown = JSON.parse((await storage.getItem(key)) ?? '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, StoredWeekSummary>) : {};
    } catch {
      return {};
    }
  };
  return {
    async get(week: string): Promise<StoredWeekSummary | null> {
      const entry = (await readAll())[week];
      return entry && typeof entry.resumen === 'string' && typeof entry.recomendacion === 'string' ? entry : null;
    },
    async set(week: string, summary: StoredWeekSummary): Promise<void> {
      const all = { ...(await readAll()), [week]: summary };
      const kept = Object.keys(all).sort().slice(-KEEP_WEEKS);
      await storage.setItem(key, JSON.stringify(Object.fromEntries(kept.map((week) => [week, all[week]]))));
    },
  };
}
