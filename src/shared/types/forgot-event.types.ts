/** Olvido anotado con "Olvidé algo". No se edita: solo se crea (como una verificación). */
export interface ForgotEvent {
  id: string;
  routineId: string;
  /** Verificación en la que se notó (si se anotó desde su resumen). */
  recordId: string | null;
  label: string;
  /** ISO 8601. */
  date: string;
}

export interface CreateForgotEventInput {
  /** Generado por el cliente para que reintentar el guardado no duplique el olvido. */
  id?: string;
  routineId: string;
  recordId?: string | null;
  label: string;
  /** Por defecto, el momento en que se anota. */
  date?: string;
}

/** Igual que el check de la columna forgot_events.label. */
export const FORGOT_LABEL_MAX_LENGTH = 60;
