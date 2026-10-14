import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

/**
 * Preferencias de Ajustes (P11) que cambian cómo suenan los avisos. La fuente es la tabla
 * `settings`; aquí se guarda una copia local porque la tarea en segundo plano no puede esperar a la red.
 */
export interface NotificationPrefs {
  /** 11-4: minutos de "Posponer" y entre recordatorios sin respuesta. */
  snoozeMinutes: number;
  /** 11-3: sin avisos mientras esté activo. */
  doNotDisturb: boolean;
  /** 11-5 */
  sound: boolean;
}

/** Opciones de 11-4. */
export const SNOOZE_OPTIONS = [2, 5, 10] as const;

/** Mismos valores por defecto que la tabla `settings`. */
export const DEFAULT_PREFS: NotificationPrefs = { snoozeMinutes: 5, doNotDisturb: false, sound: true };

const STORAGE_KEY = 'notification-prefs';

/** Un valor fuera de las opciones (p. ej. editado a mano en la base) cae al por defecto. */
export const normalizeSnooze = (minutes: number) =>
  (SNOOZE_OPTIONS as readonly number[]).includes(minutes) ? minutes : DEFAULT_PREFS.snoozeMinutes;

export async function loadNotificationPrefs(storage: KeyValueStorage = AsyncStorage): Promise<NotificationPrefs> {
  try {
    const parsed = JSON.parse((await storage.getItem(STORAGE_KEY)) ?? 'null') as Partial<NotificationPrefs> | null;
    return {
      snoozeMinutes: normalizeSnooze(Number(parsed?.snoozeMinutes)),
      doNotDisturb: parsed?.doNotDisturb === true,
      sound: parsed?.sound !== false,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export const saveNotificationPrefs = (prefs: NotificationPrefs, storage: KeyValueStorage = AsyncStorage) =>
  storage.setItem(STORAGE_KEY, JSON.stringify(prefs));

export const clearNotificationPrefs = (storage: KeyValueStorage = AsyncStorage) => storage.removeItem(STORAGE_KEY);
