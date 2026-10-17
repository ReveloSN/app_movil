// Microcopy del Documento de Contenido. No modificar los textos marcados con su código.

import { formatList } from '@/shared/utils/formatList';

export const VERIFY_NOW_LABEL = 'Verificar ahora';
export const DONE_LABEL = 'Listo';
export const SKIP_TODAY_LABEL = 'Omitir por hoy';
/** "Posponer 5 min": los minutos salen de Ajustes (11-4), igual que en la notificación. */
export { snoozeActionLabel as postponeLabel } from '@/features/notifications/notification.copy';
// Sin código en el Documento de Contenido: propuesto, pendiente de validar.
export const POSTPONE_ERROR = 'No se pudo posponer. Inténtalo de nuevo o márcalo ahora.';

/** CF-01 */
export const COMPLETE_MESSAGE = 'Todo listo. Buen camino.';

const MAX_LISTED = 3;

/** "A", "A y B", "A, B y C", "A, B, C y 2 más". */
export const formatOmittedList = (labels: readonly string[]) => formatList(labels, MAX_LISTED);

/** CF-02 */
export const partialMessage = (checked: number, total: number, omitted: readonly string[]) =>
  `${checked} de ${total} listos. Omitiste: ${formatOmittedList(omitted)}.`;

/** DC-02 */
export const criticalSkipMessage = (label: string) => `«${label}» es un ítem crítico. ¿Omitirlo de todas formas?`;
export const CRITICAL_SKIP_CONFIRM = 'Omitir';
export const CRITICAL_SKIP_CANCEL = 'Revisar';
/** 08-4: racha mínima, sin culpa (solo desde 2 días; nunca se dice que se perdió). Propuesto, pendiente de validar. */
export const STREAK_SUFFIX = 'días seguidos';
export const streakLabel = (days: number) => `${days} ${STREAK_SUFFIX}`;

/** Marca de ítem crítico (07-4) para lector de pantalla y en el resumen. */
export const CRITICAL_LABEL = 'crítico';

// Salir de P07 con ítems marcados. Botones del brief; el mensaje NO viene del Documento de Contenido.
export const EXIT_MESSAGE = 'Ya marcaste algunos ítems. ¿Salir sin terminar la verificación?';
export const EXIT_CONFIRM = 'Salir';
export const EXIT_CANCEL = 'Seguir';
