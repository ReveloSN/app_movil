/**
 * Una vez que un aviso "suena": la notificación principal más sus recordatorios. Se guarda para
 * poder posponerla, omitirla o, si nadie responde, registrarla como "sin respuesta".
 */
export interface Occurrence {
  /** `${triggerId}@${firesAt}`. */
  key: string;
  triggerId: string;
  routineId: string;
  routineName: string;
  itemCount: number;
  /** Cuenta a cuyo nombre se crean los registros (Omitir / sin respuesta). */
  ownerId: string;
  /** Epoch ms de la notificación principal. */
  firesAt: number;
  /** Epoch ms a partir del cual, sin respuesta, se registra "no_response". */
  deadline: number;
  /** Identificadores de las notificaciones programadas/mostradas (para cancelarlas). */
  notificationIds: string[];
  /** Configuración del aviso al programarla: si cambia, las futuras se reprograman. */
  signature: string;
}

/** Datos que viajan dentro de cada notificación. */
export interface OccurrenceNotificationData extends Record<string, unknown> {
  occurrenceKey: string;
  routineId: string;
}
