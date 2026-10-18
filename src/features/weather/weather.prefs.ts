import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import type { City } from './weather.client';

/** Preferencias del clima (solo en este teléfono). */
export interface WeatherPrefs {
  city: City | null;
  /** "Sugerencias de clima". Sin ciudad no tiene efecto (el interruptor se ve desactivado). */
  enabled: boolean;
  /** Vio y aceptó el aviso breve de privacidad (qué se envía a Open-Meteo). */
  consented: boolean;
}

export const DEFAULT_WEATHER_PREFS: WeatherPrefs = { city: null, enabled: false, consented: false };
const STORAGE_KEY = 'weather-prefs';

const isCity = (value: unknown): value is City => {
  if (!value || typeof value !== 'object') return false;
  const city = value as Record<string, unknown>;
  return (
    typeof city.name === 'string' &&
    typeof city.latitude === 'number' &&
    Number.isFinite(city.latitude) &&
    typeof city.longitude === 'number' &&
    Number.isFinite(city.longitude)
  );
};

export async function loadWeatherPrefs(storage: KeyValueStorage = AsyncStorage): Promise<WeatherPrefs> {
  try {
    const parsed = JSON.parse((await storage.getItem(STORAGE_KEY)) ?? 'null') as Partial<WeatherPrefs> | null;
    const city = isCity(parsed?.city) ? parsed.city : null;
    return { city, enabled: city !== null && parsed?.enabled === true, consented: parsed?.consented === true };
  } catch {
    return DEFAULT_WEATHER_PREFS;
  }
}

// Copia en memoria compartida (Observer), como las preferencias de la IA.
let current: WeatherPrefs = DEFAULT_WEATHER_PREFS;
let loaded: Promise<void> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Lee las preferencias del teléfono una vez (también fuera de React: al abrir la app). */
export function ensureWeatherPrefs(storage?: KeyValueStorage): Promise<WeatherPrefs> {
  loaded ??= loadWeatherPrefs(storage).then((prefs) => {
    current = prefs;
    notify();
  });
  return loaded.then(() => current);
}

/** Cambia las preferencias (al instante en memoria y en el teléfono). Si guardar falla, se revierte y avisa. */
export async function updateWeatherPrefs(changes: Partial<WeatherPrefs>, storage: KeyValueStorage = AsyncStorage): Promise<void> {
  const previous = current;
  const next = { ...current, ...changes };
  current = { ...next, enabled: next.city !== null && next.enabled };
  notify();
  try {
    await storage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (cause) {
    current = previous;
    notify();
    throw cause;
  }
}

export function useWeatherPrefs(): WeatherPrefs {
  useEffect(() => {
    void ensureWeatherPrefs();
  }, []);
  return useSyncExternalStore(subscribe, () => current);
}

/** Solo para pruebas: vuelve al estado inicial. */
export function resetWeatherPrefsForTests() {
  current = DEFAULT_WEATHER_PREFS;
  loaded = null;
}
