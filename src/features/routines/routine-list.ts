import type { Routine } from '@/shared/types/routine.types';

/**
 * Pone la rutina guardada en la lista: la reemplaza si ya está (la recarga desde la copia local pudo
 * traerla antes de que termine el guardado) o la añade al final. Así nunca queda repetida.
 */
export const upsertRoutine = (routines: readonly Routine[], routine: Routine): Routine[] =>
  routines.some((item) => item.id === routine.id)
    ? routines.map((item) => (item.id === routine.id ? routine : item))
    : [...routines, routine];

/** Rutinas de salida: las que cuentan para la racha, la próxima rutina, el widget y la lista de salidas. */
export const departureRoutines = <T extends Pick<Routine, 'kind'>>(routines: readonly T[]): T[] =>
  routines.filter((routine) => routine.kind === 'departure');

/** Rutinas de llegada («Al llegar»): recordatorios al volver a casa. */
export const arrivalRoutines = <T extends Pick<Routine, 'kind'>>(routines: readonly T[]): T[] =>
  routines.filter((routine) => routine.kind === 'arrival');

/**
 * Si la tarjeta de Inicio ofrece «Verificar ahora». Las de llegada no: verificar crearía un registro de
 * salida que ensuciaría el historial, y su recordatorio se atiende con «Hecho» en la notificación.
 * De la tarjeta de llegada solo se puede editar.
 */
export const canVerifyFromHome = (routine: Pick<Routine, 'kind'>): boolean => routine.kind !== 'arrival';
