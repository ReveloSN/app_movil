import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

/** Pestañas de (tabs): el nombre de la ruta. */
export const TAB_NAMES = ['index', 'history', 'settings'] as const;
export type TabName = (typeof TAB_NAMES)[number];

const STORAGE_KEY = 'last-tab';

const isTabName = (value: string | null): value is TabName => TAB_NAMES.some((name) => name === value);

/** Última pestaña usada; null si no hay o no se pudo leer (entonces se abre Inicio). */
export async function loadLastTab(storage: KeyValueStorage = AsyncStorage): Promise<TabName | null> {
  try {
    const value = await storage.getItem(STORAGE_KEY);
    return isTabName(value) ? value : null;
  } catch {
    return null;
  }
}

/** Guarda la pestaña enfocada. Si falla, la próxima vez simplemente abre Inicio. */
export async function saveLastTab(name: string, storage: KeyValueStorage = AsyncStorage): Promise<void> {
  if (!isTabName(name)) return;
  try {
    await storage.setItem(STORAGE_KEY, name);
  } catch (cause) {
    if (__DEV__) console.warn('[navigation.lastTab]', cause);
  }
}

/** Ruta de Expo Router de cada pestaña. */
export const tabPath = (name: TabName) => (name === 'index' ? '/' : (`/${name}` as const));
