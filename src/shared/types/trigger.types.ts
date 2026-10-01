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
}

export interface CreateTriggerInput {
  routineId: string;
  type: string;
  time?: string | null;
  days?: number[] | null;
  networkId?: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  active?: boolean;
}

/** Un disparador no cambia de rutina. */
export type UpdateTriggerInput = Partial<Omit<CreateTriggerInput, 'routineId'>>;
