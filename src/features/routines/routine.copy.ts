// Microcopy de P04 (crear / editar rutina).

export const NEW_ROUTINE_TITLE = 'Nueva rutina';
export const EDIT_ROUTINE_TITLE = 'Editar rutina';
export const CANCEL_LABEL = 'Cancelar';

/** BTN: "Crear rutina" al crear y "Guardar cambios" al editar (también en la hoja P05). */
export const CREATE_ROUTINE_LABEL = 'Crear rutina';
export const SAVE_CHANGES_LABEL = 'Guardar cambios';

// Errores en línea al guardar. Sin código en el Documento de Contenido: propuestos, pendientes de validar.
export const NAME_REQUIRED = 'Ponle un nombre a tu rutina.';
export const ITEMS_REQUIRED = 'Añade al menos un ítem.';

// Avisos breves tras guardar o eliminar. CF-03 (con aviso) está en trigger.copy (routineSavedMessage).
export const CHANGES_SAVED = 'Cambios guardados.';
export const ROUTINE_DELETED = 'Rutina eliminada.';

export const ADD_ITEM_LABEL = 'Añadir ítem';
export const ITEMS_SECTION_TITLE = 'Ítems';

/** EV-03 */
export const EMPTY_ITEMS_MESSAGE = 'Añade lo que no puede faltar. Con 3 o 4 cosas basta.';

// P05 (hoja "Editar ítem"). Sin código en el Documento de Contenido: propuestos, pendientes de validar.
export const NEW_ITEM_TITLE = 'Nuevo ítem';
export const EDIT_ITEM_TITLE = 'Editar ítem';
export const CLOSE_ITEM_LABEL = 'Cerrar';
export const ITEM_LABEL_FIELD = '¿Qué es?';
export const ITEM_ICON_GROUP_LABEL = 'Ícono del ítem';
export const ITEM_KIND_LABEL = 'Tipo';
export const CRITICAL_SWITCH_LABEL = 'Marcar como crítico';
export const CRITICAL_LABEL = 'Crítico';
export const ITEM_NOTE_FIELD = 'Nota';
export const ITEM_NOTE_PLACEHOLDER = 'Opcional. Ej. En el cajón de la entrada';
export const editItemHint = (label: string) => `Edita «${label}»`;
export const removeItemLabel = (label: string) => `Quitar «${label}»`;

// 04-2. Sin código en el Documento de Contenido: propuestos, pendientes de validar.
export const ICON_LABEL = 'Ícono';
export const COLOR_LABEL = 'Color';

// 04-4. Sin código en el Documento de Contenido: propuestos, pendientes de validar.
export const SUGGESTIONS_TITLE = 'Sugerencias';
export const addSuggestionLabel = (label: string) => `Añadir ${label}`;

/** 04-7 */
export const DELETE_ROUTINE_LABEL = 'Eliminar rutina';

/** DC-01 */
export const deleteRoutineMessage = (name: string) => `¿Eliminar «${name}»? También se borra su historial.`;
export const DELETE_CONFIRM = 'Eliminar';
export const DELETE_CANCEL = 'Cancelar';

// Sin código en el Documento de Contenido.
export const LOAD_ROUTINE_ERROR = 'No pudimos cargar esta rutina. Revisa tu conexión e inténtalo de nuevo.';
export const ROUTINE_NOT_FOUND = 'Esta rutina ya no existe.';
