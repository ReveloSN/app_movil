/** Para qué momento es la rutina: salir de un lugar o llegar a uno. */
export type RoutineKind = 'departure' | 'arrival';

export const DEFAULT_ROUTINE_KIND: RoutineKind = 'departure';

export interface Routine {
  id: string;
  userId: string;
  name: string;
  /** Las rutinas anteriores a este campo son todas de salida ('departure'). */
  kind: RoutineKind;
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
  /** Por defecto, 'departure' (como en la base de datos). */
  kind?: RoutineKind;
  icon?: string | null;
  color?: string | null;
  active?: boolean;
  /** Hora del cambio en el cliente; por defecto, el momento de inserción. */
  updatedAt?: string;
}

export type UpdateRoutineInput = Partial<
  Omit<CreateRoutineInput, 'id' | 'updatedAt'> & Pick<Routine, 'lastCompletedAt'>
>;
