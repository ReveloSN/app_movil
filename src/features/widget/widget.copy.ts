// Textos del widget. Sin código en el Documento de Contenido: propuestos, pendientes de validar.

export const EMPTY_TITLE = 'Sin rutinas próximas';
export const EMPTY_HINT = 'Crea un aviso en una rutina y aparecerá aquí.';
export const EMPTY_SPOKEN = `${EMPTY_TITLE}. Toca para abrir la app.`;

export const progress = (checked: number, total: number) => `${checked} de ${total}`;
export const moreItems = (count: number) => (count === 1 ? 'y 1 más' : `y ${count} más`);

/** Etiqueta visible del ítem; los críticos llevan la palabra, no solo un color. */
export const itemLabel = (label: string, critical: boolean) => (critical ? `${label} (crítico)` : label);

export const itemSpoken = (label: string, critical: boolean, checked: boolean) =>
  `${itemLabel(label, critical)}, ${checked ? 'marcado. Toca para desmarcar' : 'sin marcar. Toca para marcar'}`;

export const headerSpoken = (name: string, checked: number, total: number) =>
  `${name}, ${progress(checked, total)} ítems listos. Toca para abrir la verificación.`;
