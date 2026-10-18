// Compartir e importar rutinas (como copia). Sin código en el Documento de Contenido: propuestos,
// pendientes de validar.

import type { ShareErrorKind } from './routine-share.codec';

export const SHARE_LABEL = 'Compartir rutina';
export const shareMessage = (name: string, code: string) =>
  `Te comparto mi rutina «${name}» de Verificador. Para usarla, abre Plantillas → Tengo un código y pega esto:\n\n${code}`;
export const SHARE_ERROR = 'No se pudo abrir la opción de compartir. Inténtalo de nuevo.';

export const HAVE_CODE_LABEL = 'Tengo un código';
export const IMPORT_TITLE = 'Importar rutina';
export const CODE_FIELD = 'Código de la rutina';
export const CODE_PLACEHOLDER = 'Pega aquí el código (empieza por VS1:)';
export const CODE_HINT = 'Se añade una copia: puedes cambiarla sin afectar a quien te la envió. Los avisos los configuras tú.';
export const REVIEW_LABEL = 'Revisar código';
export const PREVIEW_TITLE = 'Vista previa';
export const ADD_LABEL = 'Añadir a mis rutinas';
export const IMPORTED = 'Rutina añadida.';
export const itemsCount = (count: number) => (count === 1 ? '1 ítem' : `${count} ítems`);

/** Errores que orientan: qué pasó y qué hacer. */
export const IMPORT_ERRORS: Record<ShareErrorKind, string> = {
  empty: 'Pega el código que te enviaron.',
  not_found: 'No encontramos un código. Copia el mensaje completo y pégalo de nuevo.',
  too_long: 'Ese texto es demasiado largo para ser un código. Copia solo el código.',
  corrupt: 'El código está dañado. Pide que te lo envíen otra vez.',
  checksum: 'El código está incompleto o mal copiado. Cópialo completo y vuelve a intentar.',
  version: 'Ese código es de otra versión de Verificador. Actualiza la app o pide uno nuevo.',
  invalid: 'El código no es una rutina válida. Pide que te lo envíen otra vez.',
};
export const IMPORT_SAVE_ERROR = 'No se pudo guardar la rutina. Inténtalo de nuevo.';
