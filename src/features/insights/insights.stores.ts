import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

// Datos de "aprender de tus olvidos" que viven solo en este teléfono, por usuario: los registros de
// verificación no se editan (no tienen updated_at), así que un olvido anotado DESPUÉS de verificar no
// puede ir dentro del registro. Se guarda aparte, enlazado por su id.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const read = async <T>(storage: KeyValueStorage, key: string, fallback: T): Promise<T> => {
  try {
    const value = await storage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** "Ahora no": el mismo patrón no se vuelve a sugerir durante una semana. */
export function createSnoozeStore(userId: string, storage: KeyValueStorage = AsyncStorage) {
  const key = `insights-snooze:${userId}`;
  return {
    async isSnoozed(patternKey: string, now: number): Promise<boolean> {
      const until = (await read<Record<string, number>>(storage, key, {}))[patternKey];
      return typeof until === 'number' && until > now;
    },
    async snooze(patternKey: string, now: number): Promise<void> {
      const all = await read<Record<string, number>>(storage, key, {});
      // Se limpian los vencidos para que la lista no crezca sin límite.
      const alive = Object.fromEntries(Object.entries(all).filter(([, until]) => until > now));
      await storage.setItem(key, JSON.stringify({ ...alive, [patternKey]: now + WEEK_MS }));
    },
  };
}

export interface ForgotEvent {
  id: string;
  routineId: string;
  /** Verificación en la que se notó (si se anotó desde su resumen). */
  recordId: string | null;
  label: string;
  /** ISO 8601. */
  date: string;
}

const FORGOT_LIMIT = 200;

/** Eventos "olvido" (Olvidé algo), para el historial de este teléfono. */
export function createForgotStore(userId: string, storage: KeyValueStorage = AsyncStorage) {
  const key = `forgot-events:${userId}`;
  return {
    getAll: () => read<ForgotEvent[]>(storage, key, []),
    async add(event: ForgotEvent): Promise<void> {
      const events = await read<ForgotEvent[]>(storage, key, []);
      await storage.setItem(key, JSON.stringify([...events, event].slice(-FORGOT_LIMIT)));
    },
  };
}
