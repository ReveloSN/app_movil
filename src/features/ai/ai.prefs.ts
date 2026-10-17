import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

/** Preferencias locales de la IA (en este teléfono, sin sincronizar ni migración). */
export interface AiPrefs {
  /** Interruptor "Sugerencias con IA" de Ajustes. Si está apagado, la IA no aparece. */
  enabled: boolean;
  /** Aceptó el aviso de privacidad de primer uso. */
  consented: boolean;
}

export const DEFAULT_AI_PREFS: AiPrefs = { enabled: true, consented: false };
const STORAGE_KEY = 'ai-prefs';

export async function loadAiPrefs(storage: KeyValueStorage = AsyncStorage): Promise<AiPrefs> {
  try {
    const parsed = JSON.parse((await storage.getItem(STORAGE_KEY)) ?? 'null') as Partial<AiPrefs> | null;
    return { enabled: parsed?.enabled !== false, consented: parsed?.consented === true };
  } catch {
    return DEFAULT_AI_PREFS;
  }
}

export async function saveAiPrefs(prefs: AiPrefs, storage: KeyValueStorage = AsyncStorage): Promise<void> {
  await storage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// Copia en memoria compartida por las pantallas (Observer): cambiar el interruptor se ve en todas.
let current: AiPrefs = DEFAULT_AI_PREFS;
let loaded = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Cambia las preferencias (en memoria al instante y en el teléfono). Si guardar falla, se avisa. */
export async function updateAiPrefs(changes: Partial<AiPrefs>, storage?: KeyValueStorage): Promise<void> {
  const previous = current;
  current = { ...current, ...changes };
  notify();
  try {
    await saveAiPrefs(current, storage);
  } catch (cause) {
    current = previous;
    notify();
    throw cause;
  }
}

/** Preferencias de la IA; la primera vez las lee del teléfono. */
export function useAiPrefs(): AiPrefs {
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    void loadAiPrefs().then((prefs) => {
      current = prefs;
      notify();
    });
  }, []);
  return useSyncExternalStore(subscribe, () => current);
}
