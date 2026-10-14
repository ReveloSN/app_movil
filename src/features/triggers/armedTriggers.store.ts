import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { ArmedTrigger } from './trigger.types';

const STORAGE_KEY = 'armed-triggers';

export interface ArmedTriggersSnapshot {
  /** Cuenta dueña de los avisos: los registros que generen (Omitir, sin respuesta) van a su nombre. */
  ownerId: string;
  triggers: ArmedTrigger[];
}

/** Copia local de los avisos activos. La lee la tarea en segundo plano, que no puede depender de la red. */
export async function loadArmedTriggers(storage: KeyValueStorage = AsyncStorage): Promise<ArmedTriggersSnapshot | null> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ArmedTriggersSnapshot> | null;
    return typeof parsed?.ownerId === 'string' && Array.isArray(parsed.triggers)
      ? { ownerId: parsed.ownerId, triggers: parsed.triggers }
      : null;
  } catch {
    return null;
  }
}

export const saveArmedTriggers = (snapshot: ArmedTriggersSnapshot, storage: KeyValueStorage = AsyncStorage) =>
  storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));

export const clearArmedTriggers = (storage: KeyValueStorage = AsyncStorage) => storage.removeItem(STORAGE_KEY);
