// Contenido de las notificaciones (Documento de Contenido). Origen: "Verificador" (nombre de la app).

import { localized } from '@/shared/i18n/localized';
import { formatList } from '@/shared/utils/formatList';

export const TITLE_MAX_LENGTH = 40;
export const BODY_MAX_LENGTH = 80;
const MAX_LISTED_ITEMS = 4;
/** Cuántos recordatorios se listan en la notificación expandida; el resto se resume como «y X más». */
export const ARRIVAL_MAX_LISTED = 6;

/** Recorta a `max` caracteres con "…" (sin dejar un espacio antes). */
const clampTo = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

/** Título = nombre de la rutina, sin prefijos, máx. 40. No lleva texto propio, así que no depende del idioma. */
export const notificationTitle = (routineName: string) => clampTo(routineName, TITLE_MAX_LENGTH);

/** "A", "A and B", "A, B and C"; con más de `maxListed`: "A, B, C and 2 more". */
const formatListEn = (labels: readonly string[], maxListed: number): string => {
  if (labels.length <= 1) return labels.join('');
  if (labels.length <= maxListed) return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  return `${labels.slice(0, maxListed).join(', ')} and ${labels.length - maxListed} more`;
};

const thingsEs = (count: number) => (count === 1 ? '1 cosa' : `${count} cosas`);
const itemsEn = (count: number) => (count === 1 ? '1 item' : `${count} items`);

/**
 * Aviso principal: "<frase del disparador> Revisa n cosas: …", con los ítems 1–4 y "y N más".
 * Si no cabe en 80 caracteres se nombran menos ítems; si ni uno cabe, solo la cantidad.
 * `sentence` arma la parte "Revisa n cosas: …" con `listed` ítems y `fallback` es la versión sin ítems nombrados.
 */
function fitBody(lead: string, labels: readonly string[], sentence: (listed: number) => string, fallback: string): string {
  for (let listed = Math.min(labels.length, MAX_LISTED_ITEMS); listed >= 1; listed -= 1) {
    const body = `${lead} ${sentence(listed)}`;
    if (body.length <= BODY_MAX_LENGTH) return body;
  }
  return clampTo(`${lead} ${fallback}`, BODY_MAX_LENGTH);
}

export default localized(
  {
    CHANNEL_NAME: 'Rutinas',
    SILENT_CHANNEL_NAME: 'Rutinas (sin sonido)',
    ARRIVAL_CHANNEL_NAME: 'Llegada a casa',
    ARRIVAL_SILENT_CHANNEL_NAME: 'Llegada a casa (sin sonido)',

    ACTION_LABELS: {
      verify: 'Verificar',
      skip: 'Omitir',
      /** Recordatorio de llegada atendido. */
      done: 'Hecho',
    },

    /** "Posponer 5 min": los minutos salen de Ajustes (11-4). */
    snoozeActionLabel: (minutes: number) => `Posponer ${minutes} min`,

    /** "Revisa 6 cosas: Llaves, Billetera, Celular cargado, Cargador y 2 más" (lista hasta 4 ítems). */
    triggerBody: (lead: string, labels: readonly string[]): string =>
      fitBody(
        lead,
        labels,
        (listed) => `Revisa ${thingsEs(labels.length)}: ${formatList(labels, listed)}`,
        `Revisa ${thingsEs(labels.length)}.`,
      ),

    /** Recordatorio (tras posponer o sin respuesta). */
    reminderBody: (itemCount: number, routineName: string) =>
      clampTo(`Aún tienes ${thingsEs(itemCount)} por revisar en ${routineName}.`, BODY_MAX_LENGTH),

    // Recordatorios de llegada a casa («Al llegar»).
    ARRIVAL_TITLE: 'Ya llegaste',

    /**
     * Cuerpo de la notificación de llegada. Android la muestra expandida (BigText) con un recordatorio por línea:
     * "3 recordatorios:\n• Poner a cargar el celular\n• Guardar las llaves\n• Dejar los zapatos". Con uno solo, va
     * directo. Se listan hasta ARRIVAL_MAX_LISTED; si hay más, la última línea dice «y X más».
     */
    arrivalBody: (labels: readonly string[]): string => {
      if (labels.length === 0) return 'Revisa tus recordatorios de llegada.';
      if (labels.length === 1) return labels[0];
      const listed = labels.slice(0, ARRIVAL_MAX_LISTED).map((label) => `• ${label}`);
      const rest = labels.length - listed.length;
      return [`${labels.length} recordatorios:`, ...listed, ...(rest > 0 ? [`y ${rest} más`] : [])].join('\n');
    },
  },
  {
    CHANNEL_NAME: 'Routines',
    SILENT_CHANNEL_NAME: 'Routines (silent)',
    ARRIVAL_CHANNEL_NAME: 'Arriving home',
    ARRIVAL_SILENT_CHANNEL_NAME: 'Arriving home (silent)',

    ACTION_LABELS: {
      verify: 'Check now',
      skip: 'Skip',
      done: 'Done',
    },

    snoozeActionLabel: (minutes: number) => `Snooze ${minutes} min`,

    /** "Check 6 items: Keys, Wallet, Charged phone, Charger and 2 more" */
    triggerBody: (lead: string, labels: readonly string[]): string =>
      fitBody(
        lead,
        labels,
        (listed) => `Check ${itemsEn(labels.length)}: ${formatListEn(labels, listed)}`,
        `Check ${itemsEn(labels.length)}.`,
      ),

    reminderBody: (itemCount: number, routineName: string) =>
      clampTo(`You still have ${itemsEn(itemCount)} to check in ${routineName}.`, BODY_MAX_LENGTH),

    ARRIVAL_TITLE: "You're home",

    arrivalBody: (labels: readonly string[]): string => {
      if (labels.length === 0) return 'Check your arrival reminders.';
      if (labels.length === 1) return labels[0];
      const listed = labels.slice(0, ARRIVAL_MAX_LISTED).map((label) => `• ${label}`);
      const rest = labels.length - listed.length;
      return [`${labels.length} reminders:`, ...listed, ...(rest > 0 ? [`and ${rest} more`] : [])].join('\n');
    },
  },
);
