// Contenido de las notificaciones (Documento de Contenido). Origen: "Verificador" (nombre de la app).

import { formatList } from '@/shared/utils/formatList';

export const TITLE_MAX_LENGTH = 40;
export const BODY_MAX_LENGTH = 80;
const MAX_LISTED_ITEMS = 4;

/** Recorta a `max` caracteres con "…" (sin dejar un espacio antes). */
const clampTo = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

export const CHANNEL_NAME = 'Rutinas';
export const SILENT_CHANNEL_NAME = 'Rutinas (sin sonido)';

export const ACTION_LABELS = {
  verify: 'Verificar',
  skip: 'Omitir',
} as const;

/** "Posponer 5 min": los minutos salen de Ajustes (11-4). */
export const snoozeActionLabel = (minutes: number) => `Posponer ${minutes} min`;

/** Título = nombre de la rutina, sin prefijos, máx. 40. */
export const notificationTitle = (routineName: string) => clampTo(routineName, TITLE_MAX_LENGTH);

const things = (count: number) => (count === 1 ? '1 cosa' : `${count} cosas`);

/** "Revisa 6 cosas: Llaves, Billetera, Celular cargado, Cargador y 2 más" (lista hasta `listed` ítems). */
const itemsSentence = (labels: readonly string[], listed: number) =>
  `Revisa ${things(labels.length)}: ${formatList(labels, listed)}`;

/**
 * Aviso principal: "<frase del disparador> Revisa n cosas: …", con los ítems 1–4 y "y N más".
 * Si no cabe en 80 caracteres se nombran menos ítems; si ni uno cabe, solo la cantidad.
 */
export function triggerBody(lead: string, labels: readonly string[]): string {
  for (let listed = Math.min(labels.length, MAX_LISTED_ITEMS); listed >= 1; listed -= 1) {
    const body = `${lead} ${itemsSentence(labels, listed)}`;
    if (body.length <= BODY_MAX_LENGTH) return body;
  }
  return clampTo(`${lead} Revisa ${things(labels.length)}.`, BODY_MAX_LENGTH);
}

/** Recordatorio (tras posponer o sin respuesta). */
export const reminderBody = (itemCount: number, routineName: string) =>
  clampTo(`Aún tienes ${things(itemCount)} por revisar en ${routineName}.`, BODY_MAX_LENGTH);
