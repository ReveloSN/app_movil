import { memoryStorage } from '@/db/local/testing/memoryStorage';

import { parseCities, parseHourlyRain, searchCities, WeatherError, type FetchLike } from './weather.client';
import { cityLocalTime, leavingWindow, weatherSuggestion, WEATHER_RULES } from './weather.rules';
import { currentWeatherSuggestion, hourlyRainFor, WEATHER_CACHE_MS } from './weather.service';
import { loadWeatherPrefs } from './weather.prefs';

const CITY = { id: 3688689, name: 'Bogotá', region: 'Bogotá D.C.', country: 'Colombia', latitude: 4.6097, longitude: -74.0817 };

const forecast = (probability: number[], precipitation: number[] = probability.map(() => 0)) => ({
  utc_offset_seconds: -18000,
  hourly: {
    time: probability.map((_, i) => `2026-10-18T${String(7 + i).padStart(2, '0')}:00`),
    precipitation_probability: probability,
    precipitation,
  },
});

const fetchReturning = (body: unknown, ok = true): jest.Mock & FetchLike =>
  jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body }) as jest.Mock & FetchLike;

// 7:30 en Bogotá (UTC-5) = 12:30 UTC.
const NOW = Date.UTC(2026, 9, 18, 12, 30);

describe('Open-Meteo · validación de respuestas', () => {
  it('ciudades: valida coordenadas y textos, descarta lo raro y respeta "sin resultados"', () => {
    expect(
      parseCities({
        results: [
          { id: 1, name: 'Bogotá', latitude: 4.6, longitude: -74.08, country: 'Colombia', admin1: 'Bogotá D.C.' },
          { id: 2, name: 'Mala', latitude: 200, longitude: 0 },
          { id: 3, latitude: 1, longitude: 1 },
          'basura',
        ],
      }),
    ).toEqual([{ id: 1, name: 'Bogotá', region: 'Bogotá D.C.', country: 'Colombia', latitude: 4.6, longitude: -74.08 }]);
    expect(parseCities({ generationtime_ms: 0.1 })).toEqual([]);
    expect(() => parseCities('nada')).toThrow(WeatherError);
  });

  it('pronóstico: listas alineadas, horas con formato y valores en rango (null → 0)', () => {
    const rain = parseHourlyRain({ ...forecast([10, 80]), hourly: { ...forecast([10, 80]).hourly, precipitation: [null, 1.2] } });
    expect(rain).toMatchObject({ probability: [10, 80], precipitation: [0, 1.2], utcOffsetSeconds: -18000 });
    expect(() => parseHourlyRain({ hourly: { time: ['x'], precipitation_probability: [1], precipitation: [0] }, utc_offset_seconds: 0 })).toThrow();
    expect(() => parseHourlyRain({ hourly: { time: ['2026-10-18T07:00'], precipitation_probability: [], precipitation: [] }, utc_offset_seconds: 0 })).toThrow();
    expect(() => parseHourlyRain({})).toThrow(WeatherError);
  });
});

describe('Open-Meteo · red', () => {
  it('busca con el nombre codificado y en español', async () => {
    const fetchImpl = fetchReturning({ results: [] });
    await searchCities('  San José ', fetchImpl);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://geocoding-api.open-meteo.com/v1/search?name=San%20Jos%C3%A9&count=5&language=es&format=json');
  });

  it('textos de menos de 2 letras no consultan', async () => {
    const fetchImpl = fetchReturning({});
    expect(await searchCities('a', fetchImpl)).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('error HTTP → http; caída de red → network; tiempo agotado → timeout', async () => {
    await expect(searchCities('Bogotá', fetchReturning({}, false))).rejects.toMatchObject({ kind: 'http' });
    await expect(searchCities('Bogotá', jest.fn().mockRejectedValue(new TypeError('Network request failed')))).rejects.toMatchObject({ kind: 'network' });

    jest.useFakeTimers();
    const never: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    const pending = searchCities('Bogotá', never);
    jest.advanceTimersByTime(4000);
    await expect(pending).rejects.toMatchObject({ kind: 'timeout' });
    jest.useRealTimers();
  });
});

describe('reglas del clima', () => {
  it('paraguas si la probabilidad máxima de la ventana es ≥ 50 % o llueve ≥ 0,5 mm', () => {
    const rain = parseHourlyRain(forecast([10, 20, 55, 90, 90]));
    expect(weatherSuggestion(rain, '2026-10-18T07:30')?.item.label).toBe('Paraguas');
    expect(weatherSuggestion(parseHourlyRain(forecast([10, 20, 30], [0, 0.6, 0])), '2026-10-18T07:10')?.id).toBe('umbrella');
  });

  it('sin lluvia en la ventana (aunque llueva después), nada', () => {
    const rain = parseHourlyRain(forecast([10, 20, 30, 90]));
    expect(leavingWindow(rain, '2026-10-18T07:30')).toEqual({ maxProbability: 30, totalPrecipitation: 0, maxPrecipitation: 0 });
    expect(weatherSuggestion(rain, '2026-10-18T07:30')).toBeNull();
  });

  it('la tabla es extensible: la primera regla que se cumple gana', () => {
    const cold = { id: 'coat', item: { label: 'Abrigo', icon: 'shirt-outline' as const }, message: '¿Abrigo?', applies: () => true };
    expect(weatherSuggestion(parseHourlyRain(forecast([0, 0, 0])), '2026-10-18T07:00', [...WEATHER_RULES, cold])?.id).toBe('coat');
  });

  it('hora local de la ciudad a partir del desfase UTC', () => {
    expect(cityLocalTime(new Date(NOW), -18000)).toBe('2026-10-18T07:30');
  });
});

describe('servicio del clima', () => {
  it('reutiliza la consulta durante 3 horas y luego la repite', async () => {
    const storage = memoryStorage();
    const fetchImpl = fetchReturning(forecast([60, 60, 60]));
    let now = NOW;
    const deps = { fetchImpl, storage, now: () => now };

    await hourlyRainFor(CITY, deps);
    await hourlyRainFor(CITY, deps);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    now += WEATHER_CACHE_MS + 1;
    await hourlyRainFor(CITY, deps);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('con lluvia, sugiere paraguas; sin red o con datos inesperados, nada (sin lanzar)', async () => {
    const now = () => NOW;
    expect((await currentWeatherSuggestion(CITY, { fetchImpl: fetchReturning(forecast([70, 70, 70])), storage: memoryStorage(), now }))?.id).toBe('umbrella');
    expect(await currentWeatherSuggestion(CITY, { fetchImpl: jest.fn().mockRejectedValue(new Error('offline')), storage: memoryStorage(), now })).toBeNull();
    expect(await currentWeatherSuggestion(CITY, { fetchImpl: fetchReturning({ hourly: 'raro' }), storage: memoryStorage(), now })).toBeNull();
  });
});

describe('preferencias del clima', () => {
  it('sin ciudad el interruptor queda apagado; datos corruptos → por defecto', async () => {
    expect(await loadWeatherPrefs(memoryStorage({ 'weather-prefs': JSON.stringify({ enabled: true, city: null }) }))).toMatchObject({ enabled: false });
    expect(await loadWeatherPrefs(memoryStorage({ 'weather-prefs': '{roto' }))).toEqual({ city: null, enabled: false, consented: false });
    expect(
      await loadWeatherPrefs(memoryStorage({ 'weather-prefs': JSON.stringify({ enabled: true, consented: true, city: CITY }) })),
    ).toEqual({ city: CITY, enabled: true, consented: true });
  });
});
