import { useCallback, useRef, useState } from 'react';

import { aiErrorMessage } from './ai.copy';
import { requestItemSuggestions } from './ai.service';
import { AiClientError } from './ai.types';
import { suggestionCacheKey } from './suggestion.cache';

type Request = typeof requestItemSuggestions;

/**
 * "Sugerir con IA" en P04-4: sugerencias para el nombre e ítems actuales. Solo valen mientras la
 * rutina no cambie (si cambia, se vuelven a pedir; la caché evita repetir la misma llamada).
 */
export function useAiSuggestions(name: string, items: readonly string[], request: Request = requestItemSuggestions) {
  const key = suggestionCacheKey(name, items);
  const [result, setResult] = useState<{ key: string; suggestions: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const suggest = useCallback(async () => {
    const call = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const suggestions = await request(name, items);
      if (call === latest.current) setResult({ key, suggestions });
    } catch (cause) {
      if (call !== latest.current) return;
      if (__DEV__ && !(cause instanceof AiClientError)) console.warn('[ai.suggest]', cause);
      setError(aiErrorMessage(cause instanceof AiClientError ? cause.kind : 'server'));
    } finally {
      if (call === latest.current) setLoading(false);
    }
  }, [request, name, items, key]);

  // Sugerencias de otra versión de la rutina (ej. ya se añadió una) no se muestran.
  const current = result && result.key === key ? result.suggestions : null;
  return { suggestions: current, loading, error, suggest };
}
