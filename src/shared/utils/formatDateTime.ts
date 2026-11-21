import { intlTag } from '@/shared/i18n/intl';

import { formatClock } from './formatClock';

// Se crea al usarlo: el idioma puede cambiar mientras la app está abierta.
const dateFormatter = () => new Intl.DateTimeFormat(intlTag(), { day: 'numeric', month: 'short' });

const parse = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const clockOf = (date: Date) => formatClock({ hour: date.getHours(), minute: date.getMinutes() });

/** "30 sept, 6:00 p. m." · "Sep 30, 6:00 PM" (hora local). Devuelve null si la fecha no es válida. */
export function formatDateTime(iso: string): string | null {
  const date = parse(iso);
  return date ? `${dateFormatter().format(date)}, ${clockOf(date)}` : null;
}

/** "6:00 p. m." (hora local). Devuelve null si la fecha no es válida. */
export function formatTime(iso: string): string | null {
  const date = parse(iso);
  return date ? clockOf(date) : null;
}
