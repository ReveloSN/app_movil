import { getLocale } from '@/shared/i18n/locale.store';
import type { ClockTime } from '@/shared/types/clock.types';

const pad = (value: number) => String(value).padStart(2, '0');

/** "6:00 p. m." en español, "6:00 PM" en inglés. Se arma a mano: el formato de Intl cambia según el motor JS del teléfono. */
export function formatClock({ hour, minute }: ClockTime): string {
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const meridiem = getLocale() === 'en' ? (hour < 12 ? 'AM' : 'PM') : hour < 12 ? 'a. m.' : 'p. m.';
  return `${hour12}:${pad(minute)} ${meridiem}`;
}

/** true si la hora se lee en singular ("la 1:00"). */
export const isOneOClock = ({ hour }: ClockTime) => hour % 12 === 1;

/** "HH:MM:SS" para columnas `time` de Postgres. */
export const toSqlTime = ({ hour, minute }: ClockTime) => `${pad(hour)}:${pad(minute)}:00`;

/** Lee "HH:MM" o "HH:MM:SS". Devuelve null si no es una hora válida. */
export function parseSqlTime(value: string | null | undefined): ClockTime | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

export const minutesOfDay = ({ hour, minute }: ClockTime) => hour * 60 + minute;
