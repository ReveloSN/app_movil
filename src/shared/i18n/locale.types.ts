/** Idiomas de la app. El español es el de origen y el que se usa mientras la persona no elija otro. */
export type Locale = 'es' | 'en';

export const LOCALES: readonly Locale[] = ['es', 'en'];
export const DEFAULT_LOCALE: Locale = 'es';

export const isLocale = (value: unknown): value is Locale => value === 'es' || value === 'en';
