const pad = (value: number) => String(value).padStart(2, '0');

/** "YYYY-MM-DD" del día en la zona horaria del dispositivo (no UTC). */
export function toLocalDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const parseDayKey = (dayKey: string) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const sameYearFormatter = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const otherYearFormatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' });

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Encabezado de un día del historial: "Hoy", "Ayer", "Lunes, 29 de septiembre" o "3 de marzo de 2025". */
export function formatDayHeading(dayKey: string, now: Date = new Date()): string {
  if (dayKey === toLocalDayKey(now)) return 'Hoy';

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey === toLocalDayKey(yesterday)) return 'Ayer';

  const date = parseDayKey(dayKey);
  const formatter = date.getFullYear() === now.getFullYear() ? sameYearFormatter : otherYearFormatter;
  return capitalize(formatter.format(date));
}
