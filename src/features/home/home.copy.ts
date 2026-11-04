// Microcopy de Inicio (P03) sin código en el Documento de Contenido: propuesto, pendiente de validar.

import type { NextRoutine } from '@/features/routines/next-routine';
import { formatClock } from '@/shared/utils/formatClock';

/** 03-1: "Buenos días, Ana" o, sin nombre, "Buenos días". La franja sale de la hora local. */
export function greeting(name: string | null, now: Date): string {
  const salute = saluteForHour(now.getHours());
  return name ? `${salute}, ${name}` : salute;
}

/** "Buenos días" (5–11), "Buenas tardes" (12–18) o "Buenas noches". También lo usa la escena de Bienvenida. */
export function saluteForHour(hour: number): string {
  return hour >= 5 && hour < 12 ? 'Buenos días' : hour >= 12 && hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}

// Tarjeta de rutina (03-3): sin código en el Documento de Contenido, propuesto, pendiente de validar.
export const VERIFY_PRESS_HINT = 'Abre la verificación';
export const editRoutineLabel = (name: string) => `Editar ${name}`;

/** Lo que oye el lector de pantalla mientras cargan las rutinas. */
export const LOADING_ROUTINES_LABEL = 'Cargando rutinas';

/** 03-2 (nombre del bloque en el Documento de Contenido). */
export const NEXT_ROUTINE_LABEL = 'Próxima rutina';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Fecha de la banda de Inicio: "Sábado, 17 de octubre". */
export const todayLabel = (now: Date) => `${WEEKDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const DAY_MS = 24 * 60 * 60_000;

/** "Hoy, 6:00 p. m." · "Mañana, 7:00 a. m." · "Lunes, 6:00 p. m." (hora local, máx. una semana). */
export function nextRoutineWhen(at: Date, now: Date): string {
  const clock = formatClock({ hour: at.getHours(), minute: at.getMinutes() });
  const days = Math.round((startOfDay(at) - startOfDay(now)) / DAY_MS);
  const day = days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : WEEKDAYS[at.getDay()];
  return `${day}, ${clock}`;
}

/** Línea de cuándo de Próxima rutina: la hora si es por horario; "Al salir del Wi-Fi" / "Al llegar al Wi-Fi" si no tiene hora. */
export function nextRoutineDescription(next: NextRoutine, now: Date): string {
  if (next.kind === 'schedule') return nextRoutineWhen(next.at, now);
  return next.kind === 'wifi_exit' ? 'Al salir del Wi-Fi' : 'Al llegar al Wi-Fi';
}
