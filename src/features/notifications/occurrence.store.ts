import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSerialQueue } from '@/shared/lib/serialQueue';

import type { Occurrence } from './occurrence.types';

const STORAGE_KEY = 'notification-occurrences';

const isOccurrence = (value: unknown): value is Occurrence => {
  const entry = value as Partial<Occurrence> | null;
  return (
    typeof entry?.key === 'string' &&
    typeof entry.routineId === 'string' &&
    typeof entry.firesAt === 'number' &&
    typeof entry.deadline === 'number' &&
    Array.isArray(entry.notificationIds)
  );
};

async function read(): Promise<Occurrence[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isOccurrence) : [];
  } catch {
    return [];
  }
}

async function write(entries: Occurrence[]): Promise<void> {
  if (entries.length === 0) await AsyncStorage.removeItem(STORAGE_KEY);
  else await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// La app en primer plano y la tarea en segundo plano pueden tocar las ocurrencias a la vez.
const serial = createSerialQueue();

/**
 * Lee, transforma y guarda las ocurrencias en una sola operación serializada.
 * `change` puede programar/cancelar notificaciones: nadie más toca la lista mientras corre.
 */
export function updateOccurrences<T>(change: (entries: Occurrence[]) => Promise<{ entries: Occurrence[]; result: T }>): Promise<T> {
  return serial(async () => {
    const { entries, result } = await change(await read());
    await write(entries);
    return result;
  });
}

export const loadOccurrences = () => serial(read);
