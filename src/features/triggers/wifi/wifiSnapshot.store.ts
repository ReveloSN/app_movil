import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

const STORAGE_KEY = 'wifi-last-ssid';

/**
 * Última red conocida, para detectar transiciones entre dos lecturas (en primer plano, al volver
 * a la app o desde la tarea en segundo plano). undefined = aún no hay lectura; null = sin Wi-Fi.
 */
export async function loadLastSsid(storage: KeyValueStorage = AsyncStorage): Promise<string | null | undefined> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (raw === null) return undefined;
  try {
    const parsed = JSON.parse(raw) as { ssid?: unknown } | null;
    return typeof parsed?.ssid === 'string' ? parsed.ssid : null;
  } catch {
    return undefined;
  }
}

export const saveLastSsid = (ssid: string | null, storage: KeyValueStorage = AsyncStorage) =>
  storage.setItem(STORAGE_KEY, JSON.stringify({ ssid }));

export const clearLastSsid = (storage: KeyValueStorage = AsyncStorage) => storage.removeItem(STORAGE_KEY);
