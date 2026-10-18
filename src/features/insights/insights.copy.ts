// Textos de "aprender de tus olvidos". Sin código en el Documento de Contenido: propuestos, pendientes de
// validar (voz y tono §02: breve, sin culpa, con solución).

import type { OmissionPattern } from './insights.detect';

const DAY_PLURAL = ['Los domingos', 'Los lunes', 'Los martes', 'Los miércoles', 'Los jueves', 'Los viernes', 'Los sábados'];

/** Mensaje determinista (sin IA): siempre disponible, también sin conexión o sin cuota. */
export function patternMessage(pattern: OmissionPattern): string {
  const lead = pattern.kind === 'weekday' ? `${DAY_PLURAL[pattern.weekday]} sueles omitir` : 'Sueles omitir';
  return `${lead} «${pattern.label}». ¿Lo marcamos como crítico?`;
}

export const INSIGHT_ACCEPT = 'Sí, marcar';
export const INSIGHT_DISMISS = 'Ahora no';
export const insightMarked = (label: string) => `«${label}» ahora es crítico.`;
export const INSIGHT_ERROR = 'No pudimos actualizar la rutina. Inténtalo de nuevo.';

export const FORGOT_LABEL = 'Olvidé algo';
export const FORGOT_TITLE = '¿Qué se te quedó?';
export const FORGOT_FIELD = 'Ítem';
export const FORGOT_PLACEHOLDER = 'Ej. Paraguas';
export const FORGOT_SAVE = 'Añadir a la rutina';
export const FORGOT_CLOSE = 'Cerrar';
export const forgotAdded = (label: string) => `Añadimos «${label}» a tu rutina.`;
/** ER-05 adaptado: se anota el olvido aunque la rutina esté llena. */
export const FORGOT_FULL = 'Lo anotamos. Tu rutina ya tiene 12 ítems: quita uno para añadirlo.';
export const FORGOT_ERROR = 'No pudimos añadirlo. Inténtalo de nuevo.';
export const forgotInHistory = (labels: readonly string[]) => `Se te quedó: ${labels.join(', ')}`;

// "Tu semana" (Historial).
export const WEEK_TITLE = 'Tu semana';
export const WEEK_EMPTY = 'Esta semana aún no hay verificaciones.';
export const WEEK_GENERATE = 'Generar resumen';
export const WEEK_LOADING = 'Preparando tu resumen…';
export const WEEK_SOURCE_AI = 'Resumen con IA';
export const WEEK_SOURCE_LOCAL = 'Resumen automático';
export const weekCounts = (completed: number, partial: number, skipped: number) =>
  [
    completed === 1 ? '1 completa' : `${completed} completas`,
    partial === 1 ? '1 parcial' : `${partial} parciales`,
    `${skipped} hoy no salgo`,
  ].join(' · ');
