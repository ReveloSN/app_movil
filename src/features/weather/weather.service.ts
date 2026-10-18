import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import { fetchHourlyRain, parseHourlyRain, type City, type FetchLike, type HourlyRain } from './weather.client';
import { cityLocalTime, weatherSuggestion, type WeatherRule } from './weather.rules';

/** La consulta se reutiliza 3 horas: abrir la app o la verificación varias veces no repite la llamada. */
export const WEATHER_CACHE_MS = 3 * 60 * 60 * 1000;
const CACHE_KEY = 'weather-cache';

interface CachedRain {
  key: string;
  fetchedAt: number;
  rain: HourlyRain;
}

const cityKey = (city: Pick<City, 'latitude' | 'longitude'>) => `${city.latitude.toFixed(3)},${city.longitude.toFixed(3)}`;

export interface WeatherDeps {
  fetchImpl?: FetchLike;
  storage?: KeyValueStorage;
  now?: () => number;
}

async function readCache(storage: KeyValueStorage, key: string, now: number): Promise<HourlyRain | null> {
  try {
    const cached = JSON.parse((await storage.getItem(CACHE_KEY)) ?? 'null') as CachedRain | null;
    if (!cached || cached.key !== key || now - cached.fetchedAt > WEATHER_CACHE_MS) return null;
    // Lo guardado también se valida: puede venir de otra versión de la app.
    return parseHourlyRain({
      hourly: { time: cached.rain.time, precipitation_probability: cached.rain.probability, precipitation: cached.rain.precipitation },
      utc_offset_seconds: cached.rain.utcOffsetSeconds,
    });
  } catch {
    return null;
  }
}

/** Lluvia por hora de la ciudad: de la caché (≤ 3 h) o de Open-Meteo (máx. 4 s). Lanza WeatherError si falla. */
export async function hourlyRainFor(city: City, { fetchImpl, storage = AsyncStorage, now = Date.now }: WeatherDeps = {}): Promise<HourlyRain> {
  const key = cityKey(city);
  const cached = await readCache(storage, key, now());
  if (cached) return cached;
  const rain = await fetchHourlyRain(city, fetchImpl);
  await storage.setItem(CACHE_KEY, JSON.stringify({ key, fetchedAt: now(), rain } satisfies CachedRain)).catch((cause: unknown) => {
    if (__DEV__) console.warn('[weather.cache]', cause);
  });
  return rain;
}

/** Regla del clima que aplica ahora en la ciudad (o null). Sin red o con error, null: nunca bloquea nada. */
export async function currentWeatherSuggestion(city: City, deps: WeatherDeps = {}): Promise<WeatherRule | null> {
  try {
    const rain = await hourlyRainFor(city, deps);
    return weatherSuggestion(rain, cityLocalTime(new Date((deps.now ?? Date.now)()), rain.utcOffsetSeconds));
  } catch (cause) {
    if (__DEV__) console.warn('[weather]', cause);
    return null;
  }
}
