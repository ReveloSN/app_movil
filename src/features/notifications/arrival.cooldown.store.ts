import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

const STORAGE_KEY = 'arrival-last-fired';
/** Pasado este tiempo la marca ya no sirve para nada (el cooldown dura minutos): se olvida. */
const KEEP_MS = 24 * 60 * 60_000;

/** Última vez que sonó la llegada de cada rutina (epoch ms). Solo guarda ids de rutina y horas. */
export type LastArrivals = Record<string, number>;

export async function loadLastArrivals(now: number, storage: KeyValueStorage = AsyncStorage): Promise<LastArrivals> {
  try {
    const parsed: unknown = JSON.parse((await storage.getItem(STORAGE_KEY)) ?? '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && now - entry[1] < KEEP_MS),
    );
  } catch {
    return {};
  }
}

export const saveLastArrivals = (last: LastArrivals, storage: KeyValueStorage = AsyncStorage) =>
  storage.setItem(STORAGE_KEY, JSON.stringify(last));

export const clearLastArrivals = (storage: KeyValueStorage = AsyncStorage) => storage.removeItem(STORAGE_KEY);
