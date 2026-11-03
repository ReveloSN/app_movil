/** Nombre del widget: el mismo que en el plugin de `app.json`. */
export const WIDGET_NAME = 'NextRoutine';

/** Toque en un ítem del widget: lo marca o lo desmarca en el borrador. */
export const ACTION_TOGGLE_ITEM = 'TOGGLE_ITEM';

export interface ToggleItemData extends Record<string, unknown> {
  routineId: string;
  itemId: string;
}

/** Enlace que abre la verificación de una rutina (el esquema es el de `app.json`). */
export const verifyUri = (routineId: string) => `verificadorsalida://routine/${routineId}/verify`;
