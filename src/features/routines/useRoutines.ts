import { useContext } from 'react';

import { RoutinesContext } from './routines.context';
import type { RoutinesContextValue } from './routines.types';

/**
 * Rutinas del usuario: { routines, loading, error, refresh, createRoutine }.
 * El estado es compartido (RoutinesProvider), así una rutina creada en /routine/new
 * aparece en la lista sin recargar.
 */
export function useRoutines(): RoutinesContextValue {
  const context = useContext(RoutinesContext);
  if (!context) {
    throw new Error('useRoutines debe usarse dentro de <RoutinesProvider>.');
  }
  return context;
}
