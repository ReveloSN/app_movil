// Open-Meteo (sin clave y sin GPS): búsqueda de ciudad y probabilidad de lluvia por hora. Solo se envía
// el nombre que la persona escribe (al buscar) o las coordenadas de la ciudad elegida (al consultar).
// Toda respuesta se valida antes de usarse: lo que llega por la red nunca se usa tal cual.

export interface City {
  id: number;
  name: string;
  /** Departamento o región (admin1), si viene. */
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface HourlyRain {
  /** Hora local de la ciudad, "AAAA-MM-DDTHH:MM". */
  time: string[];
  /** % de probabilidad de precipitación (0–100). */
  probability: number[];
  /** mm en esa hora. */
  precipitation: number[];
  /** Desfase de la hora local de la ciudad respecto a UTC, en segundos. */
  utcOffsetSeconds: number;
}

export type WeatherErrorKind = 'timeout' | 'network' | 'http' | 'invalid';

export class WeatherError extends Error {
  constructor(readonly kind: WeatherErrorKind) {
    super(`weather:${kind}`);
    this.name = 'WeatherError';
  }
}

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const WEATHER_TIMEOUT_MS = 4000;
const FORECAST_HOURS = 12;
const MAX_RESULTS = 5;
const QUERY_MAX = 60;

/** GET con tiempo máximo: nunca deja esperando a la persona (ni bloquea la verificación). */
async function getJson(url: string, fetchImpl: FetchLike, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) throw new WeatherError('http');
    return await response.json();
  } catch (cause) {
    if (cause instanceof WeatherError) throw cause;
    if (controller.signal.aborted) throw new WeatherError('timeout');
    throw new WeatherError('network');
  } finally {
    clearTimeout(timer);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finiteIn = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const shortText = (value: unknown, max = 60): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

export function parseCities(data: unknown): City[] {
  if (!isRecord(data)) throw new WeatherError('invalid');
  if (data.results === undefined) return []; // Sin coincidencias, la API omite "results".
  if (!Array.isArray(data.results)) throw new WeatherError('invalid');
  return data.results.flatMap((entry): City[] => {
    if (!isRecord(entry)) return [];
    const name = shortText(entry.name);
    if (!name || !finiteIn(entry.latitude, -90, 90) || !finiteIn(entry.longitude, -180, 180) || !Number.isInteger(entry.id)) return [];
    return [{ id: entry.id as number, name, region: shortText(entry.admin1), country: shortText(entry.country), latitude: entry.latitude, longitude: entry.longitude }];
  }).slice(0, MAX_RESULTS);
}

const HOUR = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseHourlyRain(data: unknown): HourlyRain {
  const hourly = isRecord(data) && isRecord(data.hourly) ? data.hourly : null;
  if (!hourly || !Array.isArray(hourly.time) || !Array.isArray(hourly.precipitation_probability) || !Array.isArray(hourly.precipitation)) {
    throw new WeatherError('invalid');
  }
  const { time, precipitation_probability: probability, precipitation } = hourly as { time: unknown[]; precipitation_probability: unknown[]; precipitation: unknown[] };
  if (time.length === 0 || time.length !== probability.length || time.length !== precipitation.length) throw new WeatherError('invalid');
  if (!time.every((value) => typeof value === 'string' && HOUR.test(value))) throw new WeatherError('invalid');
  // Un valor faltante (null) cuenta como 0: no inventa lluvia, pero tampoco rompe la regla.
  const clean = (values: unknown[], max: number) => values.map((value) => (finiteIn(value, 0, max) ? value : 0));
  const offset = (data as Record<string, unknown>).utc_offset_seconds;
  if (!finiteIn(offset, -14 * 3600, 14 * 3600)) throw new WeatherError('invalid');
  return { time: time as string[], probability: clean(probability, 100), precipitation: clean(precipitation, 500), utcOffsetSeconds: offset };
}

export async function searchCities(query: string, fetchImpl: FetchLike = fetch as unknown as FetchLike): Promise<City[]> {
  const name = query.trim().slice(0, QUERY_MAX);
  if (name.length < 2) return [];
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=${MAX_RESULTS}&language=es&format=json`;
  return parseCities(await getJson(url, fetchImpl, WEATHER_TIMEOUT_MS));
}

export async function fetchHourlyRain(city: Pick<City, 'latitude' | 'longitude'>, fetchImpl: FetchLike = fetch as unknown as FetchLike): Promise<HourlyRain> {
  const url =
    `${FORECAST_URL}?latitude=${city.latitude.toFixed(4)}&longitude=${city.longitude.toFixed(4)}` +
    `&hourly=precipitation_probability,precipitation&forecast_hours=${FORECAST_HOURS}&timezone=auto`;
  return parseHourlyRain(await getJson(url, fetchImpl, WEATHER_TIMEOUT_MS));
}
