// Microcopy de P04 (crear / editar rutina).

export const NEW_ROUTINE_TITLE = 'Nueva rutina';
export const EDIT_ROUTINE_TITLE = 'Editar rutina';
export const CANCEL_LABEL = 'Cancelar';

/** Crear y editar: el Documento de Contenido solo registra este texto. */
export const SAVE_CHANGES_LABEL = 'Guardar cambios';

export const ADD_ITEM_LABEL = 'Añadir ítem';
export const ITEMS_SECTION_TITLE = 'Ítems';

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
