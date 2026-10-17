import { useEffect, useState } from 'react';

// Pantallas o bloques que ya se mostraron en esta sesión de la app.
const seen = new Set<string>();

/**
 * true solo la primera vez que se muestra `key` en esta sesión (ej. para animar la entrada de Inicio
 * una vez y no cada vez que se vuelve a la pestaña).
 */
export function useFirstAppearance(key: string): boolean {
  const [first] = useState(() => !seen.has(key));
  useEffect(() => {
    seen.add(key);
  }, [key]);
  return first;
}
