import type { Routine } from '@/shared/types/routine.types';

/**
 * Pone la rutina guardada en la lista: la reemplaza si ya está (la recarga desde la copia local pudo
 * traerla antes de que termine el guardado) o la añade al final. Así nunca queda repetida.
 */
export const upsertRoutine = (routines: readonly Routine[], routine: Routine): Routine[] =>
  routines.some((item) => item.id === routine.id)
    ? routines.map((item) => (item.id === routine.id ? routine : item))
    : [...routines, routine];
