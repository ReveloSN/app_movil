const formatter = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** "30 sept, 08:15". Devuelve null si la fecha no es válida. */
export function formatDateTime(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : formatter.format(date);
}

const timeFormatter = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' });

/** "08:15" (hora local). Devuelve null si la fecha no es válida. */
export function formatTime(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : timeFormatter.format(date);
}
