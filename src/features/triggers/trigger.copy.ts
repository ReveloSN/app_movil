import type { Weekday } from '@/shared/types/clock.types';
import { endSentence } from '@/shared/utils/endSentence';
import { formatClock, isOneOClock } from '@/shared/utils/formatClock';
import { formatList } from '@/shared/utils/formatList';

import type { TimeWindow } from './trigger.types';

// Lunes primero, como se leen los días en la UI.
export const WEEK_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export const DAY_LETTERS: Record<Weekday, string> = { 0: 'D', 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S' };

export const DAY_NAMES: Record<Weekday, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
};

/** "L a V", "L, X y V", "S y D". Tres o más días seguidos se resumen como rango. */
export function formatDays(days: readonly Weekday[]): string {
  const ordered = WEEK_ORDER.filter((day) => days.includes(day));
  const positions = ordered.map((day) => WEEK_ORDER.indexOf(day));
  const consecutive = positions.every((position, index) => index === 0 || position === positions[index - 1] + 1);
  if (ordered.length >= 3 && consecutive) {
    return `${DAY_LETTERS[ordered[0]]} a ${DAY_LETTERS[ordered[ordered.length - 1]]}`;
  }
  return formatList(ordered.map((day) => DAY_LETTERS[day]));
}

/** "a las 6:00 p. m." / "a la 1:00 p. m." */
export const atClock = (time: Parameters<typeof formatClock>[0]) =>
  `${isOneOClock(time) ? 'a la' : 'a las'} ${formatClock(time)}`;

/** " entre 6:00 a. m. y 9:00 a. m." (con espacio inicial) o "" sin franja. */
export const windowSuffix = (window: TimeWindow | null) =>
  window ? ` entre ${formatClock(window.start)} y ${formatClock(window.end)}` : '';

/** 06-6. "Te avisaremos cuando salgas de Casa." */
export const summarySentence = (phrase: string) => endSentence(`Te avisaremos ${phrase}`);

/** CF-03 adaptado al aviso: "Rutina guardada. Te avisaremos cuando salgas de Casa." */
export const routineSavedMessage = (phrases: readonly string[]) =>
  phrases.length === 0 ? 'Rutina guardada.' : `Rutina guardada. ${summarySentence(formatList(phrases))}`;

// Textos de P04/P06 sin código en el Documento de Contenido.
export const TRIGGERS_SECTION_TITLE = 'Avisos';
export const ADD_TRIGGER_LABEL = 'Añadir aviso';
/** Aviso breve al quitar un aviso (con "Deshacer"). */
export const TRIGGER_REMOVED = 'Quitaste el aviso.';
export const MAX_TRIGGERS_REACHED = 'Una rutina admite hasta 3 avisos. Quita uno para añadir otro.';
export const SAVE_TRIGGER_LABEL = 'Guardar aviso';
export const CONFIGURE_TRIGGER_TITLE = 'Configurar aviso';

// Red detectada (06-4) y franja (06-5). Sin código en el Documento de Contenido.
export const DETECT_NETWORK_LABEL = 'Detectar red actual';
export const detectedNetworkMessage = (ssid: string) => `Estás conectado a «${ssid}».`;
export const applyNetworkLabel = (ssid: string) => `Usar «${ssid}»`;
/** ER-03: no hay Wi-Fi, o el teléfono no deja leer su nombre (con permiso y ubicación ya activos). */
export const NETWORK_NOT_FOUND_MESSAGE = 'No encontramos tu red. Conéctate a ella y vuelve a intentar.';
export const WINDOW_SWITCH_LABEL = 'Solo en una franja horaria';
