import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

const STORAGE_KEY = 'wifi-last-seen';

/**
 * Última vez que este teléfono estuvo conectado a cada red (SSID → epoch ms). `home_networks`
 * no tiene esa columna: es un dato local, para "cuándo se usó" en Redes de casa (11-1).
 */
export async function loadNetworkLastSeen(storage: KeyValueStorage = AsyncStorage): Promise<Record<string, number>> {
  try {
    const parsed: unknown = JSON.parse((await storage.getItem(STORAGE_KEY)) ?? '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
    );
  } catch {
    return {};
  }
}

export async function markNetworkSeen(ssid: string, at: number, storage: KeyValueStorage = AsyncStorage): Promise<void> {
  const seen = await loadNetworkLastSeen(storage);
  await storage.setItem(STORAGE_KEY, JSON.stringify({ ...seen, [ssid]: at }));
}
