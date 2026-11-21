import { getLocale } from './locale.store';
import type { Locale } from './locale.types';

/** Etiqueta BCP 47 para `Intl` (fechas y horas) según el idioma activo. */
export const intlTag = (locale: Locale = getLocale()): string => (locale === 'en' ? 'en-US' : 'es');

/** Idioma del reconocimiento de voz (dictado). */
export const speechLang = (locale: Locale = getLocale()): string => (locale === 'en' ? 'en-US' : 'es-CO');
