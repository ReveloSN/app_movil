/** Si la fecha ISO cae el mismo día del calendario local que `now`. false si la fecha no es válida. */
export function isSameLocalDay(iso: string | null, now: Date): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
