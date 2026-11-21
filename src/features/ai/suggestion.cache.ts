import { getLocale } from '@/shared/i18n/locale.store';

/** Clave de caché: nombre + ítems, sin importar mayúsculas, espacios ni el orden de los ítems. */
export function suggestionCacheKey(name: string, items: readonly string[]): string {
  const norm = (value: string) => value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('es');
  const key = [norm(name), items.map(norm).filter(Boolean).sort()];
  // Las sugerencias dependen del idioma de la respuesta; el español conserva su clave de siempre.
  return JSON.stringify(getLocale() === 'en' ? ['en', ...key] : key);
}

/** Caché de sugerencias durante la sesión (en memoria): la misma rutina no repite la llamada. */
export function createSuggestionCache(limit = 30) {
  const entries = new Map<string, string[]>();
  return {
    get: (name: string, items: readonly string[]) => entries.get(suggestionCacheKey(name, items)),
    set(name: string, items: readonly string[], suggestions: string[]) {
      const key = suggestionCacheKey(name, items);
      entries.delete(key);
      entries.set(key, suggestions);
      // Se descarta lo más viejo: la caché nunca crece sin límite.
      if (entries.size > limit) entries.delete(entries.keys().next().value as string);
    },
  };
}

export type SuggestionCache = ReturnType<typeof createSuggestionCache>;

/** Una sola caché para toda la app mientras esté abierta. */
export const sessionSuggestionCache = createSuggestionCache();
