// Compartir e importar rutinas (como copia). Sin código en el Documento de Contenido: propuestos,
// pendientes de validar. Solo los textos fijos: el nombre y los ítems de la rutina no se traducen.

import { localized } from '@/shared/i18n/localized';

export default localized(
  {
    SHARE_LABEL: 'Compartir rutina',
    shareMessage: (name: string, code: string) =>
      `Te comparto mi rutina «${name}» de Verificador. Para usarla, abre Plantillas → Tengo un código y pega esto:\n\n${code}`,
    SHARE_ERROR: 'No se pudo abrir la opción de compartir. Inténtalo de nuevo.',

    HAVE_CODE_LABEL: 'Tengo un código',
    IMPORT_TITLE: 'Importar rutina',
    CODE_FIELD: 'Código de la rutina',
    CODE_PLACEHOLDER: 'Pega aquí el código (empieza por VS1:)',
    CODE_HINT: 'Se añade una copia: puedes cambiarla sin afectar a quien te la envió. Los avisos los configuras tú.',
    REVIEW_LABEL: 'Revisar código',
    PREVIEW_TITLE: 'Vista previa',
    ADD_LABEL: 'Añadir a mis rutinas',
    IMPORTED: 'Rutina añadida.',
    itemsCount: (count: number) => (count === 1 ? '1 ítem' : `${count} ítems`),

    /** Errores que orientan: qué pasó y qué hacer. */
    IMPORT_ERRORS: {
      empty: 'Pega el código que te enviaron.',
      not_found: 'No encontramos un código. Copia el mensaje completo y pégalo de nuevo.',
      too_long: 'Ese texto es demasiado largo para ser un código. Copia solo el código.',
      corrupt: 'El código está dañado. Pide que te lo envíen otra vez.',
      checksum: 'El código está incompleto o mal copiado. Cópialo completo y vuelve a intentar.',
      version: 'Ese código es de otra versión de Verificador. Actualiza la app o pide uno nuevo.',
      invalid: 'El código no es una rutina válida. Pide que te lo envíen otra vez.',
    },
    IMPORT_SAVE_ERROR: 'No se pudo guardar la rutina. Inténtalo de nuevo.',
  },
  {
    SHARE_LABEL: 'Share routine',
    shareMessage: (name: string, code: string) =>
      `I'm sharing my routine "${name}" from Verificador. To use it, open Templates → I have a code and paste this:\n\n${code}`,
    SHARE_ERROR: "Couldn't open the share option. Try again.",

    HAVE_CODE_LABEL: 'I have a code',
    IMPORT_TITLE: 'Import routine',
    CODE_FIELD: 'Routine code',
    CODE_PLACEHOLDER: 'Paste the code here (starts with VS1:)',
    CODE_HINT: "A copy is added: you can change it without affecting the person who sent it. You set up the alerts yourself.",
    REVIEW_LABEL: 'Review code',
    PREVIEW_TITLE: 'Preview',
    ADD_LABEL: 'Add to my routines',
    IMPORTED: 'Routine added.',
    itemsCount: (count: number) => (count === 1 ? '1 item' : `${count} items`),

    IMPORT_ERRORS: {
      empty: 'Paste the code you were sent.',
      not_found: "We couldn't find a code. Copy the whole message and paste it again.",
      too_long: 'That text is too long to be a code. Copy only the code.',
      corrupt: 'The code is damaged. Ask them to send it again.',
      checksum: 'The code is incomplete or was copied wrong. Copy all of it and try again.',
      version: 'That code is from another version of Verificador. Update the app or ask for a new one.',
      invalid: "The code isn't a valid routine. Ask them to send it again.",
    },
    IMPORT_SAVE_ERROR: "Couldn't save the routine. Try again.",
  },
);
