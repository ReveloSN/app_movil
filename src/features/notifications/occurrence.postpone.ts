import type { Occurrence } from './occurrence.types';

/** Lo que se sabe de la rutina al posponer desde la verificación (P07). */
export interface PostponeTarget {
  routineId: string;
  routineName: string;
  itemCount: number;
  ownerId: string;
}

/** Prefijo de las veces creadas al posponer desde P07 sin una notificación previa (no son de ningún aviso). */
export const MANUAL_TRIGGER_PREFIX = 'manual:';

export interface PostponePlan {
  /** La vez que se pospone: la última que ya sonó de esa rutina, o una nueva si no sonó ninguna. */
  target: Occurrence;
  /** Otras veces ya sonadas de la misma rutina: quedan respondidas (se cancelan sus recordatorios). */
  superseded: Occurrence[];
}

/**
 * Posponer desde P07 equivale a tocar "Posponer" en la notificación de esa rutina: se reprograma la
 * última vez que ya sonó. Si se abrió desde Inicio sin notificación, se crea una vez nueva (sin aviso)
 * para que tenga los mismos recordatorios y, si nadie responde, termine como "sin respuesta".
 */
export function planPostpone(entries: readonly Occurrence[], routine: PostponeTarget, now: number): PostponePlan {
  const fired = entries
    .filter((entry) => entry.routineId === routine.routineId && entry.firesAt <= now)
    .sort((a, b) => b.firesAt - a.firesAt);
  const [latest, ...superseded] = fired;
  if (latest) return { target: latest, superseded };

  return {
    target: {
      key: `${MANUAL_TRIGGER_PREFIX}${routine.routineId}@${now}`,
      triggerId: `${MANUAL_TRIGGER_PREFIX}${routine.routineId}`,
      routineId: routine.routineId,
      routineName: routine.routineName,
      itemCount: routine.itemCount,
      ownerId: routine.ownerId,
      firesAt: now,
      deadline: now,
      notificationIds: [],
      signature: '',
    },
    superseded: [],
  };
}
