import { localized } from '@/shared/i18n/localized';
import type { Weekday } from '@/shared/types/clock.types';
import { endSentence } from '@/shared/utils/endSentence';
import { formatClock, isOneOClock } from '@/shared/utils/formatClock';
import { formatList } from '@/shared/utils/formatList';

import type { TimeWindow } from './trigger.types';

// Lunes primero, como se leen los días en la UI.
export const WEEK_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const ALL_DAYS = 7;

/** Días en orden de lectura, y si forman un tramo seguido de tres o más (se resume como rango). */
function orderedDays(days: readonly Weekday[]) {
  const ordered = WEEK_ORDER.filter((day) => days.includes(day));
  const positions = ordered.map((day) => WEEK_ORDER.indexOf(day));
  const consecutive = positions.every((position, index) => index === 0 || position === positions[index - 1] + 1);
  return { ordered, range: ordered.length >= 3 && consecutive };
}

const DAY_LETTERS_ES: Record<Weekday, string> = { 0: 'D', 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S' };
// En inglés las letras se repiten (T, T, S, S), pero es la convención de los calendarios de EE. UU.
const DAY_LETTERS_EN: Record<Weekday, string> = { 0: 'S', 1: 'M', 2: 'T', 3: 'W', 4: 'T', 5: 'F', 6: 'S' };

const DAY_NAMES_ES: Record<Weekday, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
};
const DAY_NAMES_EN: Record<Weekday, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

/** "A", "A and B", "A, B and C" (sin coma antes de "and", como el resto de los textos en inglés). */
const joinEn = (items: readonly string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** "L a V", "L, X y V", "S y D". Tres o más días seguidos se resumen como rango. */
const formatDaysEs = (days: readonly Weekday[]): string => {
  const { ordered, range } = orderedDays(days);
  if (range) return `${DAY_LETTERS_ES[ordered[0]]} a ${DAY_LETTERS_ES[ordered[ordered.length - 1]]}`;
  return formatList(ordered.map((day) => DAY_LETTERS_ES[day]));
};

/** "Monday to Friday", "Monday, Wednesday and Friday", "Saturday and Sunday". */
const formatDaysEn = (days: readonly Weekday[]): string => {
  const { ordered, range } = orderedDays(days);
  if (range) return `${DAY_NAMES_EN[ordered[0]]} to ${DAY_NAMES_EN[ordered[ordered.length - 1]]}`;
  return joinEn(ordered.map((day) => DAY_NAMES_EN[day]));
};

const atClockEs = (time: Parameters<typeof formatClock>[0]) => `${isOneOClock(time) ? 'a la' : 'a las'} ${formatClock(time)}`;

const windowSuffixEs = (window: TimeWindow | null) =>
  window ? ` entre ${formatClock(window.start)} y ${formatClock(window.end)}` : '';
const windowSuffixEn = (window: TimeWindow | null) =>
  window ? ` between ${formatClock(window.start)} and ${formatClock(window.end)}` : '';

export default localized(
  {
    DAY_LETTERS: DAY_LETTERS_ES,
    DAY_NAMES: DAY_NAMES_ES,

    formatDays: formatDaysEs,

    /** "a las 6:00 p. m." / "a la 1:00 p. m." */
    atClock: atClockEs,

    /** " entre 6:00 a. m. y 9:00 a. m." (con espacio inicial) o "" sin franja. */
    windowSuffix: windowSuffixEs,

    /** 06-6. "Te avisaremos cuando salgas de Casa." */
    summarySentence: (phrase: string) => endSentence(`Te avisaremos ${phrase}`),

    /** CF-03 adaptado al aviso: "Rutina guardada. Te avisaremos cuando salgas de Casa." */
    routineSavedMessage: (phrases: readonly string[]) =>
      phrases.length === 0 ? 'Rutina guardada.' : `Rutina guardada. ${endSentence(`Te avisaremos ${formatList(phrases)}`)}`,

    // Frases de cada tipo de aviso (las usan las estrategias): descripción para el resumen y primera frase de la notificación.
    SCHEDULE_LABEL: 'Horario',
    WIFI_EXIT_LABEL: 'Salir del Wi-Fi',
    WIFI_ENTER_LABEL: 'Llegar al Wi-Fi',
    /** "todos los días a las 6:00 p. m." / "todos los L a V a las 6:00 p. m." */
    scheduleDescription: (days: readonly Weekday[], time: Parameters<typeof formatClock>[0]) =>
      days.length === ALL_DAYS ? `todos los días ${atClockEs(time)}` : `todos los ${formatDaysEs(days)} ${atClockEs(time)}`,
    /** Varias horas con los mismos días: "todos los días a las 7:00 a. m. y 8:00 a. m." */
    scheduleTimesDescription: (days: readonly Weekday[], times: readonly Parameters<typeof formatClock>[0][]) =>
      `${days.length === ALL_DAYS ? 'todos los días' : `todos los ${formatDaysEs(days)}`} ${times.length === 1 ? atClockEs(times[0]) : `a las ${formatList(times.map(formatClock))}`}`,
    /** "Son las 6:00 p. m." */
    scheduleLead: (time: Parameters<typeof formatClock>[0]) =>
      endSentence(`${isOneOClock(time) ? 'Es la' : 'Son las'} ${formatClock(time)}`),
    wifiExitPhrase: (networkName: string) => `cuando salgas de ${networkName}`,
    wifiEnterPhrase: (networkName: string) => `cuando llegues a ${networkName}`,
    wifiExitLead: (networkName: string) => endSentence(`Te desconectaste del Wi-Fi de ${networkName}`),
    wifiEnterLead: (networkName: string) => endSentence(`Te conectaste al Wi-Fi de ${networkName}`),

    // Textos de P04/P06 sin código en el Documento de Contenido.
    TRIGGERS_SECTION_TITLE: 'Avisos',
    /** "Avisos, 2 de 3" para el lector de pantalla. */
    triggersCountLabel: (count: number, max: number) => `Avisos, ${count} de ${max}`,
    ADD_TRIGGER_LABEL: 'Añadir aviso',
    /** Aviso breve al quitar un aviso (con "Deshacer"). */
    TRIGGER_REMOVED: 'Quitaste el aviso.',
    maxTriggersReached: (max: number) => `Una rutina admite hasta ${max} avisos. Quita uno para añadir otro.`,
    SAVE_TRIGGER_LABEL: 'Guardar aviso',
    saveTriggersLabel: (count: number) => `Guardar ${count} avisos`,
    /** Aviso breve al guardar varias horas de una vez. */
    triggersAdded: (count: number) => `Añadiste ${count} avisos.`,
    ADD_TIME_LABEL: 'Añadir otra hora',
    extraTimeLabel: (position: number) => `Hora ${position}`,
    removeTimeLabel: (time: string) => `Quitar la hora ${time}`,
    DUPLICATE_TIMES_HINT: 'Las horas repetidas se guardan una sola vez.',
    timesLimitHint: (remaining: number) => `Puedes añadir ${remaining} horas más en esta rutina.`,
    CONFIGURE_TRIGGER_TITLE: 'Configurar aviso',

    // Red detectada (06-4) y franja (06-5). Sin código en el Documento de Contenido.
    DETECT_NETWORK_LABEL: 'Detectar red actual',
    DETECTING_NETWORK_LABEL: 'Detectando la red',
    DETECTING_NETWORK_TEXT: 'Detectando la red…',
    detectedNetworkMessage: (ssid: string) => `Estás conectado a «${ssid}».`,
    applyNetworkLabel: (ssid: string) => `Usar «${ssid}»`,
    /** ER-03: no hay Wi-Fi, o el teléfono no deja leer su nombre (con permiso y ubicación ya activos). */
    NETWORK_NOT_FOUND_MESSAGE: 'No encontramos tu red. Conéctate a ella y vuelve a intentar.',
    /** Rutinas de llegada: solo admiten el aviso al conectarse al Wi-Fi de casa. */
    ARRIVAL_ONLY_WIFI_HINT: 'Una rutina de llegada te avisa cuando tu teléfono se conecta al Wi-Fi de casa.',
    WINDOW_SWITCH_LABEL: 'Solo en una franja horaria',

    /** Nombre propuesto para la red del aviso, y el que se usa en la frase de vista previa mientras está vacío. */
    DEFAULT_NETWORK_NAME: 'Casa',
    NETWORK_NAME_PLACEHOLDER: 'tu red',

    // Validación del formulario de avisos.
    ARRIVAL_ONLY_WIFI_ERROR: 'Una rutina de llegada solo admite el aviso al conectarse al Wi-Fi de casa.',
    DAYS_REQUIRED_ERROR: 'Elige al menos un día.',
    SSID_REQUIRED_ERROR: 'Escribe el nombre de la red Wi-Fi o detecta la actual.',
    maxLengthError: (max: number) => `Máximo ${max} caracteres.`,
    NETWORK_NAME_REQUIRED_ERROR: 'Ponle un nombre a la red (ej. Casa).',
    WINDOW_SAME_TIMES_ERROR: 'La franja debe empezar y terminar a horas distintas.',
  },
  {
    DAY_LETTERS: DAY_LETTERS_EN,
    DAY_NAMES: DAY_NAMES_EN,

    formatDays: formatDaysEn,

    /** "at 6:00 PM" */
    atClock: (time: Parameters<typeof formatClock>[0]) => `at ${formatClock(time)}`,

    /** " between 6:00 AM and 9:00 AM" (con espacio inicial) o "". */
    windowSuffix: windowSuffixEn,

    summarySentence: (phrase: string) => endSentence(`We'll alert you ${phrase}`),

    routineSavedMessage: (phrases: readonly string[]) =>
      phrases.length === 0 ? 'Routine saved.' : `Routine saved. ${endSentence(`We'll alert you ${joinEn(phrases)}`)}`,

    SCHEDULE_LABEL: 'Schedule',
    WIFI_EXIT_LABEL: 'Leave the Wi-Fi',
    WIFI_ENTER_LABEL: 'Reach the Wi-Fi',
    /** "every day at 6:00 PM" / "on Monday to Friday at 6:00 PM" */
    scheduleDescription: (days: readonly Weekday[], time: Parameters<typeof formatClock>[0]) =>
      days.length === ALL_DAYS ? `every day at ${formatClock(time)}` : `on ${formatDaysEn(days)} at ${formatClock(time)}`,
    scheduleTimesDescription: (days: readonly Weekday[], times: readonly Parameters<typeof formatClock>[0][]) =>
      `${days.length === ALL_DAYS ? 'every day' : `on ${formatDaysEn(days)}`} at ${joinEn(times.map(formatClock))}`,
    /** "It's 6:00 PM." */
    scheduleLead: (time: Parameters<typeof formatClock>[0]) => endSentence(`It's ${formatClock(time)}`),
    wifiExitPhrase: (networkName: string) => `when you leave ${networkName}`,
    wifiEnterPhrase: (networkName: string) => `when you reach ${networkName}`,
    wifiExitLead: (networkName: string) => endSentence(`You disconnected from the ${networkName} Wi-Fi`),
    wifiEnterLead: (networkName: string) => endSentence(`You connected to the ${networkName} Wi-Fi`),

    TRIGGERS_SECTION_TITLE: 'Alerts',
    triggersCountLabel: (count: number, max: number) => `Alerts, ${count} of ${max}`,
    ADD_TRIGGER_LABEL: 'Add alert',
    TRIGGER_REMOVED: 'You removed the alert.',
    maxTriggersReached: (max: number) => `A routine allows up to ${max} alerts. Remove one to add another.`,
    SAVE_TRIGGER_LABEL: 'Save alert',
    saveTriggersLabel: (count: number) => `Save ${count} alerts`,
    triggersAdded: (count: number) => `You added ${count} alerts.`,
    ADD_TIME_LABEL: 'Add another time',
    extraTimeLabel: (position: number) => `Time ${position}`,
    removeTimeLabel: (time: string) => `Remove the ${time} time`,
    DUPLICATE_TIMES_HINT: 'Repeated times are saved only once.',
    timesLimitHint: (remaining: number) => `You can add ${remaining} more times to this routine.`,
    CONFIGURE_TRIGGER_TITLE: 'Set up alert',

    DETECT_NETWORK_LABEL: 'Detect current network',
    DETECTING_NETWORK_LABEL: 'Detecting the network',
    DETECTING_NETWORK_TEXT: 'Detecting the network…',
    detectedNetworkMessage: (ssid: string) => `You're connected to “${ssid}”.`,
    applyNetworkLabel: (ssid: string) => `Use “${ssid}”`,
    NETWORK_NOT_FOUND_MESSAGE: "We couldn't find your network. Connect to it and try again.",
    ARRIVAL_ONLY_WIFI_HINT: 'An arrival routine alerts you when your phone connects to your home Wi-Fi.',
    WINDOW_SWITCH_LABEL: 'Only during a time window',

    DEFAULT_NETWORK_NAME: 'Home',
    NETWORK_NAME_PLACEHOLDER: 'your network',

    ARRIVAL_ONLY_WIFI_ERROR: 'An arrival routine only supports the alert for connecting to your home Wi-Fi.',
    DAYS_REQUIRED_ERROR: 'Pick at least one day.',
    SSID_REQUIRED_ERROR: 'Enter the Wi-Fi network name or detect the current one.',
    maxLengthError: (max: number) => `Maximum ${max} characters.`,
    NETWORK_NAME_REQUIRED_ERROR: 'Give the network a name (e.g. Home).',
    WINDOW_SAME_TIMES_ERROR: 'The time window must start and end at different times.',
  },
);
