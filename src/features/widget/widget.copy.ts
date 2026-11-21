// Textos del widget. Sin código en el Documento de Contenido: propuestos, pendientes de validar.

import { localized } from '@/shared/i18n/localized';

const progressEs = (checked: number, total: number) => `${checked} de ${total}`;
const progressEn = (checked: number, total: number) => `${checked} of ${total}`;

/** Etiqueta visible del ítem; los críticos llevan la palabra, no solo un color. */
const itemLabelEs = (label: string, critical: boolean) => (critical ? `${label} (crítico)` : label);
const itemLabelEn = (label: string, critical: boolean) => (critical ? `${label} (critical)` : label);

const emptyTitleEs = 'Sin rutinas próximas';
const emptyTitleEn = 'No upcoming routines';

export default localized(
  {
    EMPTY_TITLE: emptyTitleEs,
    EMPTY_HINT: 'Crea un aviso en una rutina y aparecerá aquí.',
    EMPTY_SPOKEN: `${emptyTitleEs}. Toca para abrir la app.`,

    progress: progressEs,

    itemLabel: itemLabelEs,

    itemSpoken: (label: string, critical: boolean, checked: boolean) =>
      `${itemLabelEs(label, critical)}, ${checked ? 'marcado. Toca para desmarcar' : 'sin marcar. Toca para marcar'}`,

    headerSpoken: (name: string, checked: number, total: number) =>
      `${name}, ${progressEs(checked, total)} ítems listos. Toca para abrir la verificación.`,
  },
  {
    EMPTY_TITLE: emptyTitleEn,
    EMPTY_HINT: 'Add an alert to a routine and it will show up here.',
    EMPTY_SPOKEN: `${emptyTitleEn}. Tap to open the app.`,

    progress: progressEn,

    itemLabel: itemLabelEn,

    itemSpoken: (label: string, critical: boolean, checked: boolean) =>
      `${itemLabelEn(label, critical)}, ${checked ? 'checked. Tap to uncheck' : 'unchecked. Tap to check'}`,

    headerSpoken: (name: string, checked: number, total: number) =>
      `${name}, ${progressEn(checked, total)} items ready. Tap to open the check.`,
  },
);
