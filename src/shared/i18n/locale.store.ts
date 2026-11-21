import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import { DEFAULT_LOCALE, isLocale, type Locale } from './locale.types';

const STORAGE_KEY = 'app-language';

let current: Locale = DEFAULT_LOCALE;
const listeners = new Set<(locale: Locale) => void>();

/** Idioma activo. Se lee al usar cada texto, así que sirve igual en la interfaz y en tareas sin pantalla. */
export const getLocale = (): Locale => current;

export function subscribeLocale(listener: (locale: Locale) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function apply(next: Locale): void {
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener(next));
}

/**
 * Lee el idioma guardado y lo aplica. Sin valor legible se queda el español. También lo llama la tarea en
 * segundo plano antes de armar una notificación: allí no hay pantalla que lo haya cargado.
 */
export async function loadLocale(storage: KeyValueStorage = AsyncStorage): Promise<Locale> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (isLocale(stored)) apply(stored);
  } catch {
    // Sin preferencia legible: se sigue con el idioma actual.
  }
  return current;
}

/** Cambia el idioma al instante y lo guarda. Si no se puede guardar, aplica igual durante esta sesión. */
export async function setLocale(next: Locale, storage: KeyValueStorage = AsyncStorage): Promise<void> {
  apply(next);
  try {
    await storage.setItem(STORAGE_KEY, next);
  } catch {
    // Se queda solo en memoria hasta que se pueda guardar.
  }
}

/** Solo para pruebas: vuelve al idioma por defecto sin tocar el almacenamiento. */
export function resetLocaleForTests(): void {
  current = DEFAULT_LOCALE;
  listeners.clear();
}
