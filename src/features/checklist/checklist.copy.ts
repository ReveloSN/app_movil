// Microcopy del Documento de Contenido. No modificar los textos marcados con su código.

import { localized } from '@/shared/i18n/localized';
import { formatList } from '@/shared/utils/formatList';

const MAX_LISTED = 3;

const streakSuffixEs = 'días seguidos';
const streakSuffixEn = 'days in a row';

export default localized(
  {
    VERIFY_NOW_LABEL: 'Verificar ahora',
    DONE_LABEL: 'Listo',
    SKIP_TODAY_LABEL: 'Omitir por hoy',
    /** "Posponer 5 min": los minutos salen de Ajustes (11-4), igual que en la notificación. */
    postponeLabel: (minutes: number) => `Posponer ${minutes} min`,
    // Sin código en el Documento de Contenido: propuesto, pendiente de validar.
    POSTPONE_ERROR: 'No se pudo posponer. Inténtalo de nuevo o márcalo ahora.',

    /** CF-01 */
    COMPLETE_MESSAGE: 'Todo listo. Buen camino.',

    /** "A", "A y B", "A, B y C", "A, B, C y 2 más". */
    formatOmittedList: (labels: readonly string[]) => formatList(labels, MAX_LISTED),

    /** CF-02 */
    partialMessage: (checked: number, total: number, omitted: readonly string[]) =>
      `${checked} de ${total} listos. Omitiste: ${formatList(omitted, MAX_LISTED)}.`,

    /** DC-02 */
    criticalSkipMessage: (label: string) => `«${label}» es un ítem crítico. ¿Omitirlo de todas formas?`,
    CRITICAL_SKIP_CONFIRM: 'Omitir',
    CRITICAL_SKIP_CANCEL: 'Revisar',
    /** 07-3: conteo visible junto a la barra y su versión para lector de pantalla. */
    progressCount: (checked: number, total: number) => `${checked} de ${total}`,
    progressSpoken: (checked: number, total: number) => `${checked} de ${total} ítems listos`,
    CLOSE_VERIFY_LABEL: 'Cerrar verificación',

    // "Listo" sin nada marcado. Sin código en el Documento de Contenido: propuesto, pendiente de validar.
    EMPTY_DONE_MESSAGE: 'Aún no marcaste ningún ítem. ¿Omitir la verificación de hoy?',
    /** 08-4: racha mínima, sin culpa (solo desde 2 días; nunca se dice que se perdió). Propuesto, pendiente de validar. */
    STREAK_SUFFIX: streakSuffixEs,
    streakLabel: (days: number) => `${days} ${streakSuffixEs}`,

    /** Marca de ítem crítico (07-4) para lector de pantalla y en el resumen. */
    CRITICAL_LABEL: 'crítico',

    // Modo "una por una" de P07. Sin código en el Documento de Contenido: propuesto, pendiente de validar.
    VIEW_MODE_LABEL: 'Forma de verificar',
    VIEW_LIST_LABEL: 'Lista',
    VIEW_DECK_LABEL: 'Una por una',
    CARRY_LABEL: 'Lo llevo',
    NOT_CARRY_LABEL: 'No lo llevo',
    UNDO_LABEL: 'Deshacer',
    SWIPE_HINT: 'Desliza a la derecha si lo llevas y a la izquierda si no.',
    DECK_DONE_TITLE: 'Revisaste todo',
    DECK_DONE_MESSAGE: 'Toca «Listo» para guardar la verificación.',

    // Salir de P07 con ítems marcados. Botones del brief; el mensaje NO viene del Documento de Contenido.
    EXIT_MESSAGE: 'Ya marcaste algunos ítems. ¿Salir sin terminar la verificación?',
    EXIT_CONFIRM: 'Salir',
    EXIT_CANCEL: 'Seguir',

    // Modo salida (pantalla completa). Sin código en el Documento de Contenido: propuesto, pendiente de validar.
    DEPARTURE_MODE_LABEL: 'Modo salida',
    DEPARTURE_MODE_HINT: 'Abre la verificación en pantalla completa, con ítems grandes',
    DEPARTURE_DONE_LABEL: 'Listo, salgo',
    CLOSE_DEPARTURE_LABEL: 'Cerrar modo salida',
    /** Cifra al centro del anillo, ej. "3/8". */
    ringCenter: (checked: number, total: number) => `${checked}/${total}`,

    // Estados de la pantalla de verificación (P07), del modo salida y del resumen (P08).
    LOADING_ITEMS_LABEL: 'Cargando ítems',
    NO_ITEMS_MESSAGE: 'Esta rutina no tiene ítems.',
    LOAD_ITEMS_ERROR: 'No pudimos cargar los ítems de esta rutina.',
    SAVE_VERIFICATION_ERROR: 'No se pudo guardar la verificación. Inténtalo de nuevo.',
    /** Botón de P08 para volver a Inicio. */
    BACK_TO_ROUTINES_LABEL: 'Volver a mis rutinas',
    SUMMARY_OMITTED_TITLE: 'Omitidos',
    SUMMARY_DURATION_TITLE: 'Duración',
  },
  {
    VERIFY_NOW_LABEL: 'Check now',
    DONE_LABEL: 'Done',
    SKIP_TODAY_LABEL: 'Skip for today',
    postponeLabel: (minutes: number) => `Snooze ${minutes} min`,
    POSTPONE_ERROR: "Couldn't snooze. Try again or check it now.",

    COMPLETE_MESSAGE: 'All set. Have a good trip.',

    formatOmittedList: (labels: readonly string[]) => formatList(labels, MAX_LISTED),

    partialMessage: (checked: number, total: number, omitted: readonly string[]) =>
      `${checked} of ${total} done. You skipped: ${formatList(omitted, MAX_LISTED)}.`,

    criticalSkipMessage: (label: string) => `"${label}" is a critical item. Skip it anyway?`,
    CRITICAL_SKIP_CONFIRM: 'Skip',
    CRITICAL_SKIP_CANCEL: 'Review',
    progressCount: (checked: number, total: number) => `${checked} of ${total}`,
    progressSpoken: (checked: number, total: number) => `${checked} of ${total} items done`,
    CLOSE_VERIFY_LABEL: 'Close check',

    EMPTY_DONE_MESSAGE: "You haven't checked any items yet. Skip today's check?",
    STREAK_SUFFIX: streakSuffixEn,
    streakLabel: (days: number) => `${days} ${streakSuffixEn}`,

    CRITICAL_LABEL: 'critical',

    VIEW_MODE_LABEL: 'How to check',
    VIEW_LIST_LABEL: 'List',
    VIEW_DECK_LABEL: 'One by one',
    CARRY_LABEL: "I'm taking it",
    NOT_CARRY_LABEL: "I'm not taking it",
    UNDO_LABEL: 'Undo',
    SWIPE_HINT: "Swipe right if you're taking it and left if not.",
    DECK_DONE_TITLE: 'You checked everything',
    DECK_DONE_MESSAGE: 'Tap "Done" to save the check.',

    EXIT_MESSAGE: "You've already checked some items. Leave without finishing the check?",
    EXIT_CONFIRM: 'Leave',
    EXIT_CANCEL: 'Stay',

    DEPARTURE_MODE_LABEL: 'Leaving mode',
    DEPARTURE_MODE_HINT: 'Opens the check in full screen, with large items',
    DEPARTURE_DONE_LABEL: "Done, I'm leaving",
    CLOSE_DEPARTURE_LABEL: 'Close leaving mode',
    ringCenter: (checked: number, total: number) => `${checked}/${total}`,

    LOADING_ITEMS_LABEL: 'Loading items',
    NO_ITEMS_MESSAGE: "This routine doesn't have any items.",
    LOAD_ITEMS_ERROR: "We couldn't load this routine's items.",
    SAVE_VERIFICATION_ERROR: "Couldn't save the check. Try again.",
    BACK_TO_ROUTINES_LABEL: 'Back to my routines',
    SUMMARY_OMITTED_TITLE: 'Skipped',
    SUMMARY_DURATION_TITLE: 'Duration',
  },
);
