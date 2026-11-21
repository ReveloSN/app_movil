// Textos de la sección «Idioma» de Ajustes. Los nombres de los idiomas van siempre en su propio idioma.

import { localized } from '@/shared/i18n/localized';

export const LANGUAGE_NAMES = { es: 'Español', en: 'English' } as const;

export default localized(
  {
    SECTION_TITLE: 'Idioma',
    GROUP_LABEL: 'Idioma de la app',
    HINT: 'La app cambia al instante. Tus rutinas y notas se quedan como las escribiste.',
  },
  {
    SECTION_TITLE: 'Language',
    GROUP_LABEL: 'App language',
    HINT: 'The app switches right away. Your routines and notes stay as you wrote them.',
  },
);
