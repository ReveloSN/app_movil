import type { ForgotEvent } from '@/shared/types/forgot-event.types';

/** Tope de olvidos en el teléfono: los más viejos salen primero (el servidor los conserva todos). */
export const FORGOT_EVENTS_LIMIT = 500;

const newestFirst = (a: ForgotEvent, b: ForgotEvent) => Date.parse(b.date) - Date.parse(a.date);

/** Del más reciente al más antiguo, como mucho FORGOT_EVENTS_LIMIT. */
export const capForgotEvents = (events: readonly ForgotEvent[]): ForgotEvent[] =>
  [...events].sort(newestFirst).slice(0, FORGOT_EVENTS_LIMIT);

/** Agrega olvidos nuevos. Solo inserción: si el id ya está, se queda el que había. */
export function addForgotEvents(current: readonly ForgotEvent[], added: readonly ForgotEvent[]): ForgotEvent[] {
  const known = new Set(current.map((event) => event.id));
  const fresh = added.filter((event) => !known.has(event.id) && known.add(event.id));
  return capForgotEvents([...current, ...fresh]);
}
