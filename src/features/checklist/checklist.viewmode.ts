import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

/** Forma de verificar en P07: la lista completa o un ítem a la vez deslizando. */
export type ViewMode = 'list' | 'deck';

/**
 * Preferencia de este teléfono (no se sincroniza: depende de cómo sostienes y usas el aparato, y así no
 * hace falta cambiar la tabla `settings`). Sin valor guardado, se abre la lista.
 */
const STORAGE_KEY = 'verify-view-mode';

export async function loadViewModePreference(storage: KeyValueStorage = AsyncStorage): Promise<ViewMode> {
  try {
    return (await storage.getItem(STORAGE_KEY)) === 'deck' ? 'deck' : 'list';
  } catch {
    return 'list';
  }
}

export const saveViewModePreference = (mode: ViewMode, storage: KeyValueStorage = AsyncStorage) =>
  storage.setItem(STORAGE_KEY, mode);
