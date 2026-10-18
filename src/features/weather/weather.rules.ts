import type { IoniconName } from '@/shared/utils/ioniconName';

import type { HourlyRain } from './weather.client';

/** Datos de la ventana de salida (las próximas horas) que miran las reglas. */
export interface WeatherWindow {
  maxProbability: number;
  totalPrecipitation: number;
  maxPrecipitation: number;
}

export interface WeatherRule {
  id: string;
  /** Ítem que se sugiere añadir solo hoy. */
  item: { label: string; icon: IoniconName };
  /** Pregunta que ve la persona en P07. */
  message: string;
  applies(window: WeatherWindow): boolean;
}

/**
 * Tabla de reglas (extensible: una regla nueva es una fila más). La primera que se cumple es la que se
 * sugiere, para no llenar la verificación de avisos.
 */
export const WEATHER_RULES: readonly WeatherRule[] = [
  {
    id: 'umbrella',
    item: { label: 'Paraguas', icon: 'umbrella-outline' },
    message: 'Hoy puede llover. ¿Añadimos «Paraguas»?',
    applies: ({ maxProbability, maxPrecipitation }) => maxProbability >= 50 || maxPrecipitation >= 0.5,
  },
];

/** Horas de la ventana de salida, desde la hora en curso. */
export const LEAVING_WINDOW_HOURS = 3;

/** Resume la ventana [hora actual, +3 h) de la ciudad (sus horas vienen en su hora local). */
export function leavingWindow(rain: HourlyRain, cityNow: string, hours = LEAVING_WINDOW_HOURS): WeatherWindow | null {
  const currentHour = cityNow.slice(0, 13); // "AAAA-MM-DDTHH"
  const start = rain.time.findIndex((time) => time.slice(0, 13) >= currentHour);
  if (start === -1) return null;
  const end = Math.min(start + hours, rain.time.length);
  const probability = rain.probability.slice(start, end);
  const precipitation = rain.precipitation.slice(start, end);
  return {
    maxProbability: Math.max(...probability),
    totalPrecipitation: precipitation.reduce((sum, value) => sum + value, 0),
    maxPrecipitation: Math.max(...precipitation),
  };
}

/** Regla del clima que aplica ahora, o null. */
export function weatherSuggestion(rain: HourlyRain, cityNow: string, rules: readonly WeatherRule[] = WEATHER_RULES): WeatherRule | null {
  const window = leavingWindow(rain, cityNow);
  return window ? (rules.find((rule) => rule.applies(window)) ?? null) : null;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** "AAAA-MM-DDTHH:MM" del instante `now` en una ciudad con este desfase UTC (segundos). */
export function cityLocalTime(now: Date, utcOffsetSeconds: number): string {
  const local = new Date(now.getTime() + utcOffsetSeconds * 1000);
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
}
