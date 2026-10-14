// Microcopy del Documento de Contenido. No modificar los textos marcados con su código.

import { formatList } from '@/shared/utils/formatList';

export const VERIFY_NOW_LABEL = 'Verificar ahora';
export const DONE_LABEL = 'Listo';
export const SKIP_TODAY_LABEL = 'Omitir por hoy';

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

// Salir de P07 con ítems marcados. Botones del brief; el mensaje NO viene del Documento de Contenido.
export const EXIT_MESSAGE = 'Ya marcaste algunos ítems. ¿Salir sin terminar la verificación?';
export const EXIT_CONFIRM = 'Salir';
export const EXIT_CANCEL = 'Seguir';
