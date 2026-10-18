import { useCallback, useState } from 'react';

import * as copy from './weather.copy';
import { searchCities, type City, type FetchLike } from './weather.client';

/** Búsqueda de ciudad (Ajustes): resultados, cargando y un error que orienta (sin red, sin coincidencias). */
export function useCitySearch(fetchImpl?: FetchLike) {
  const [results, setResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const search = useCallback(
    async (query: string) => {
      setSearching(true);
      setMessage(null);
      try {
        const cities = await searchCities(query, fetchImpl);
        setResults(cities);
        if (cities.length === 0) setMessage(copy.NO_CITIES);
      } catch (cause) {
        if (__DEV__) console.warn('[weather.search]', cause);
        setResults([]);
        setMessage(copy.SEARCH_ERROR);
      } finally {
        setSearching(false);
      }
    },
    [fetchImpl],
  );

  const clear = useCallback(() => {
    setResults([]);
    setMessage(null);
  }, []);

  return { results, searching, message, search, clear };
}
