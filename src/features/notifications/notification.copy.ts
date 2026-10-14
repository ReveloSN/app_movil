// Contenido de las notificaciones (Documento de Contenido). Origen: "Verificador" (nombre de la app).

import { formatList } from '@/shared/utils/formatList';

const TITLE_MAX_LENGTH = 40;
const MAX_LISTED_ITEMS = 4;

export const CHANNEL_NAME = 'Rutinas';
export const SILENT_CHANNEL_NAME = 'Rutinas (sin sonido)';

export const ACTION_LABELS = {
  verify: 'Verificar',
  skip: 'Omitir',
} as const;

/** "Posponer 5 min": los minutos salen de Ajustes (11-4). */
export const snoozeActionLabel = (minutes: number) => `Posponer ${minutes} min`;

/** Título = nombre de la rutina, sin prefijos, máx. 40. */
export const notificationTitle = (routineName: string) => routineName.slice(0, TITLE_MAX_LENGTH);

const things = (count: number) => (count === 1 ? '1 cosa' : `${count} cosas`);

/** "Revisa 6 cosas: Llaves, Billetera, Celular cargado, Cargador y 2 más" */
export const itemsSentence = (labels: readonly string[]) =>
  `Revisa ${things(labels.length)}: ${formatList(labels, MAX_LISTED_ITEMS)}`;

/** Aviso principal: "<frase del disparador> Revisa n cosas: …" */
export const triggerBody = (lead: string, labels: readonly string[]) => `${lead} ${itemsSentence(labels)}`;

/** Recordatorio (tras posponer o sin respuesta). */
export const reminderBody = (itemCount: number, routineName: string) =>
  `Aún tienes ${things(itemCount)} por revisar en ${routineName}.`;
