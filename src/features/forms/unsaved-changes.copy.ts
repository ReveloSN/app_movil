// DC-03 (Documento de Navegación: "Guardar · Descartar" al salir de P04 o P06 con cambios). El
// Documento de Contenido no define el título ni el cuerpo: propuestos, pendientes de validar.

import { localized } from '@/shared/i18n/localized';

export default localized(
  {
    UNSAVED_TITLE: '¿Guardar los cambios?',
    UNSAVED_MESSAGE: 'Si sales ahora, se pierde lo que escribiste.',
    UNSAVED_SAVE: 'Guardar',
    UNSAVED_DISCARD: 'Descartar',
  },
  {
    UNSAVED_TITLE: 'Save your changes?',
    UNSAVED_MESSAGE: "If you leave now, what you wrote will be lost.",
    UNSAVED_SAVE: 'Save',
    UNSAVED_DISCARD: 'Discard',
  },
);
