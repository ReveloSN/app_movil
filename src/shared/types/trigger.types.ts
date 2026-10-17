export interface Trigger {
  id: string;
  routineId: string;
  /** Tipo de disparador (horario / salir de Wi-Fi / entrar a Wi-Fi). */
  type: string;
  /** Hora local "HH:MM:SS". */
  time: string | null;
  /** Días de la semana en que aplica. */
  days: number[] | null;
  networkId: string | null;
  /** Ventana horaria "HH:MM:SS" para disparadores de Wi-Fi. */
  windowStart: string | null;
  windowEnd: string | null;
  active: boolean;
  /** ISO 8601. Hora del último cambio en el dispositivo que lo hizo (resolución de conflictos). */
  updatedAt: string;
}

export interface CreateTriggerInput {
  /** Generado por el cliente para crear sin conexión; si falta, lo pone la base de datos. */
  id?: string;
  routineId: string;
  type: string;
  time?: string | null;
  days?: number[] | null;
  networkId?: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  active?: boolean;
  /** Hora del cambio en el cliente; por defecto, el momento de inserción. */
  updatedAt?: string;
}

/** Un disparador no cambia de rutina. */
export type UpdateTriggerInput = Partial<Omit<CreateTriggerInput, 'id' | 'routineId' | 'updatedAt'>>;
