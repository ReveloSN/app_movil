import { intlTag } from '@/shared/i18n/intl';
import { localized } from '@/shared/i18n/localized';

const pad = (value: number) => String(value).padStart(2, '0');

/** "YYYY-MM-DD" del día en la zona horaria del dispositivo (no UTC). */
export function toLocalDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const parseDayKey = (dayKey: string) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Palabras del encabezado. Viven aquí (y no en history.copy) para no crear un ciclo: history.copy usa este módulo.
const words = localized({ TODAY: 'Hoy', YESTERDAY: 'Ayer' }, { TODAY: 'Today', YESTERDAY: 'Yesterday' });

// Los formateadores se crean al usarlos (el idioma puede cambiar) y se guardan por etiqueta de idioma.
const formatters = new Map<string, Intl.DateTimeFormat>();
const formatterFor = (tag: string, key: 'sameYear' | 'otherYear'): Intl.DateTimeFormat => {
  const id = `${tag}:${key}`;
  let formatter = formatters.get(id);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(
      tag,
      key === 'sameYear' ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' },
    );
    formatters.set(id, formatter);
  }
  return formatter;
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Encabezado de un día del historial: "Hoy", "Ayer", "Lunes, 29 de septiembre" o "3 de marzo de 2025" (en inglés: "Today", "Yesterday", "Monday, September 29", "March 3, 2025"). */
export function formatDayHeading(dayKey: string, now: Date = new Date()): string {
  if (dayKey === toLocalDayKey(now)) return words.TODAY;

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey === toLocalDayKey(yesterday)) return words.YESTERDAY;

  const date = parseDayKey(dayKey);
  const formatter = formatterFor(intlTag(), date.getFullYear() === now.getFullYear() ? 'sameYear' : 'otherYear');
  return capitalize(formatter.format(date));
}
