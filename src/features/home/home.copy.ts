// Microcopy de Inicio (P03) sin código en el Documento de Contenido: propuesto, pendiente de validar.

import type { NextRoutine } from '@/features/routines/next-routine';
import { localized } from '@/shared/i18n/localized';
import { formatClock } from '@/shared/utils/formatClock';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const DAY_MS = 24 * 60 * 60_000;
/** Días de diferencia entre `at` y `now` (0 = hoy, 1 = mañana). */
const daysBetween = (at: Date, now: Date) => Math.round((startOfDay(at) - startOfDay(now)) / DAY_MS);

const WEEKDAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const saluteEs = (hour: number) => (hour >= 5 && hour < 12 ? 'Buenos días' : hour >= 12 && hour < 19 ? 'Buenas tardes' : 'Buenas noches');
const saluteEn = (hour: number) => (hour >= 5 && hour < 12 ? 'Good morning' : hour >= 12 && hour < 18 ? 'Good afternoon' : 'Good evening');

/** "Hoy, 6:00 p. m." · "Mañana, 7:00 a. m." · "Lunes, 6:00 p. m." (hora local, máx. una semana). */
const whenEs = (at: Date, now: Date): string => {
  const clock = formatClock({ hour: at.getHours(), minute: at.getMinutes() });
  const days = daysBetween(at, now);
  const day = days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : WEEKDAYS_ES[at.getDay()];
  return `${day}, ${clock}`;
};

/** "Today, 6:00 PM" · "Tomorrow, 7:00 AM" · "Monday, 6:00 PM". */
const whenEn = (at: Date, now: Date): string => {
  const clock = formatClock({ hour: at.getHours(), minute: at.getMinutes() });
  const days = daysBetween(at, now);
  const day = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : WEEKDAYS_EN[at.getDay()];
  return `${day}, ${clock}`;
};

export default localized(
  {
    /** 03-1: "Buenos días, Ana" o, sin nombre, "Buenos días". La franja sale de la hora local. */
    greeting: (name: string | null, now: Date): string => {
      const salute = saluteEs(now.getHours());
      return name ? `${salute}, ${name}` : salute;
    },
    /** "Buenos días" (5–11), "Buenas tardes" (12–18) o "Buenas noches". También lo usa la escena de Bienvenida. */
    saluteForHour: saluteEs,

    // Tarjeta de rutina (03-3): sin código en el Documento de Contenido, propuesto, pendiente de validar.
    VERIFY_PRESS_HINT: 'Abre la verificación',
    VERIFIED_TODAY_LABEL: 'Verificada hoy',
    VERIFY_AGAIN_LABEL: 'Verificar otra vez',
    editRoutineLabel: (name: string) => `Editar ${name}`,

    /** Lo que oye el lector de pantalla mientras cargan las rutinas. */
    LOADING_ROUTINES_LABEL: 'Cargando rutinas',

    // EV-01: sin rutinas todavía (título, texto y salida hacia las plantillas).
    EMPTY_ROUTINES_TITLE: 'Aún no tienes rutinas',
    EMPTY_ROUTINES_MESSAGE: 'Empieza con una plantilla o crea la tuya.',
    EMPTY_ROUTINES_ACTION: 'Ver plantillas',

    /** 03-2 (nombre del bloque en el Documento de Contenido). */
    NEXT_ROUTINE_LABEL: 'Próxima rutina',

    /** Fecha de la banda de Inicio: "Sábado, 17 de octubre". */
    todayLabel: (now: Date) => `${WEEKDAYS_ES[now.getDay()]}, ${now.getDate()} de ${MONTHS_ES[now.getMonth()]}`,

    nextRoutineWhen: whenEs,

    /** Línea de cuándo de Próxima rutina: la hora si es por horario; "Al salir del Wi-Fi" / "Al llegar al Wi-Fi" si no tiene hora. */
    nextRoutineDescription: (next: NextRoutine, now: Date): string => {
      if (next.kind === 'schedule') return whenEs(next.at, now);
      return next.kind === 'wifi_exit' ? 'Al salir del Wi-Fi' : 'Al llegar al Wi-Fi';
    },

    /** Sección de Inicio con las rutinas de llegada (recordatorios al volver a casa). */
    ARRIVAL_SECTION_TITLE: 'Al llegar',
  },
  {
    greeting: (name: string | null, now: Date): string => {
      const salute = saluteEn(now.getHours());
      return name ? `${salute}, ${name}` : salute;
    },
    saluteForHour: saluteEn,

    VERIFY_PRESS_HINT: 'Opens the check',
    VERIFIED_TODAY_LABEL: 'Checked today',
    VERIFY_AGAIN_LABEL: 'Check again',
    editRoutineLabel: (name: string) => `Edit ${name}`,

    LOADING_ROUTINES_LABEL: 'Loading routines',

    EMPTY_ROUTINES_TITLE: "You don't have any routines yet",
    EMPTY_ROUTINES_MESSAGE: 'Start with a template or create your own.',
    EMPTY_ROUTINES_ACTION: 'See templates',

    NEXT_ROUTINE_LABEL: 'Next routine',

    /** "Saturday, October 17" */
    todayLabel: (now: Date) => `${WEEKDAYS_EN[now.getDay()]}, ${MONTHS_EN[now.getMonth()]} ${now.getDate()}`,

    nextRoutineWhen: whenEn,

    nextRoutineDescription: (next: NextRoutine, now: Date): string => {
      if (next.kind === 'schedule') return whenEn(next.at, now);
      return next.kind === 'wifi_exit' ? 'When you leave the Wi-Fi' : 'When you reach the Wi-Fi';
    },

    ARRIVAL_SECTION_TITLE: 'On arrival',
  },
);
