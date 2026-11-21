// Microcopy del Historial (P09). EV-02 viene del Documento de Contenido; el resto no tiene código:
// propuesto, pendiente de validar.

import { localized } from '@/shared/i18n/localized';
import { formatClock } from '@/shared/utils/formatClock';

import { formatDayHeading, toLocalDayKey } from './history.dates';

/** "Hoy, 6:00 p. m." · "Lunes, 29 de septiembre, 6:00 p. m." (hora local). null si la fecha no es válida. Neutra al idioma. */
export function recordDateTime(iso: string, now: Date = new Date()): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const clock = formatClock({ hour: date.getHours(), minute: date.getMinutes() });
  return `${formatDayHeading(toLocalDayKey(date), now)}, ${clock}`;
}

export default localized(
  {
    /** EV-02 */
    EMPTY_TITLE: 'Todavía no hay verificaciones',
    EMPTY_MESSAGE: 'Aquí verás cada verificación que hagas.',
    EMPTY_ACTION: 'Ir a Inicio',
    EMPTY_ACTION_HINT: 'Vuelve a Inicio para verificar una rutina',

    /** Lo que oye el lector de pantalla mientras carga el primer listado. */
    LOADING_LABEL: 'Cargando historial',
    /** Error al leer el historial de la copia local. */
    LOAD_ERROR: 'No pudimos leer tu historial en este teléfono. Inténtalo de nuevo.',

    // 09-3
    FILTER_ROUTINE_LABEL: 'Rutina',
    FILTER_RESULT_LABEL: 'Resultado',
    ALL_ROUTINES_LABEL: 'Todas',
    ALL_RESULTS_LABEL: 'Todos',
    FILTER_EMPTY_MESSAGE: 'Nada con este filtro. Prueba con otro.',

    /** Etiqueta (texto, no solo color) de los registros de rutinas de llegada. */
    ARRIVAL_ROW_LABEL: 'Llegada',

    // 09-4
    MOST_SKIPPED_TITLE: 'Más omitidos',
    timesLabel: (count: number) => (count === 1 ? '1 vez' : `${count} veces`),

    // Hoja de detalle de un registro.
    DETAIL_CLOSE_LABEL: 'Cerrar',
    DETAIL_CHECKED_TITLE: 'Marcados',
    DETAIL_SKIPPED_TITLE: 'Omitidos',
    DETAIL_DURATION_TITLE: 'Duración',
    DETAIL_NO_ITEMS: 'Esta vez no se marcó ningún ítem.',
    CRITICAL_LABEL: 'crítico',
    openDetailHint: 'Abre el detalle',

    /** Marca de un ítem temporal añadido por el clima (solo esa verificación). */
    WEATHER_ORIGIN_LABEL: 'Clima',

    /** Para registros cuya rutina ya no está en la lista del usuario. */
    UNKNOWN_ROUTINE_NAME: 'Rutina eliminada',

    // Resultado de una verificación (records.result). Las claves son datos; los valores, texto.
    RESULT_LABELS: {
      completed: 'Completa',
      partial: 'Parcial',
      skipped: 'Omitida',
      no_response: 'Sin respuesta',
    } as Record<string, string>,
    UNKNOWN_RESULT_LABEL: 'Sin resultado',
  },
  {
    EMPTY_TITLE: 'No checks yet',
    EMPTY_MESSAGE: "You'll see every check you do here.",
    EMPTY_ACTION: 'Go to Home',
    EMPTY_ACTION_HINT: 'Go back to Home to check a routine',

    LOADING_LABEL: 'Loading history',
    LOAD_ERROR: "We couldn't read your history on this phone. Try again.",

    FILTER_ROUTINE_LABEL: 'Routine',
    FILTER_RESULT_LABEL: 'Result',
    ALL_ROUTINES_LABEL: 'All',
    ALL_RESULTS_LABEL: 'All',
    FILTER_EMPTY_MESSAGE: 'Nothing with this filter. Try another.',

    ARRIVAL_ROW_LABEL: 'Arrival',

    MOST_SKIPPED_TITLE: 'Most skipped',
    timesLabel: (count: number) => (count === 1 ? '1 time' : `${count} times`),

    DETAIL_CLOSE_LABEL: 'Close',
    DETAIL_CHECKED_TITLE: 'Checked',
    DETAIL_SKIPPED_TITLE: 'Skipped',
    DETAIL_DURATION_TITLE: 'Duration',
    DETAIL_NO_ITEMS: 'No items were checked this time.',
    CRITICAL_LABEL: 'critical',
    openDetailHint: 'Opens the details',

    WEATHER_ORIGIN_LABEL: 'Weather',

    UNKNOWN_ROUTINE_NAME: 'Deleted routine',

    RESULT_LABELS: {
      completed: 'Complete',
      partial: 'Partial',
      skipped: 'Skipped',
      no_response: 'No response',
    },
    UNKNOWN_RESULT_LABEL: 'No result',
  },
);
