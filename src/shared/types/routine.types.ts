export interface Routine {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  active: boolean;
  /** ISO 8601. */
  lastCompletedAt: string | null;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. Hora del último cambio en el dispositivo que lo hizo (resolución de conflictos). */
  updatedAt: string;
}

export interface CreateRoutineInput {
  /** Generado por el cliente para crear sin conexión; si falta, lo pone la base de datos. */
  id?: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  active?: boolean;
  /** Hora del cambio en el cliente; por defecto, el momento de inserción. */
  updatedAt?: string;
}

export type UpdateRoutineInput = Partial<
  Omit<CreateRoutineInput, 'id' | 'updatedAt'> & Pick<Routine, 'lastCompletedAt'>
>;
