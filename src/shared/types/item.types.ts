export interface Item {
  id: string;
  routineId: string;
  label: string;
  icon: string | null;
  type: string | null;
  critical: boolean;
  note: string | null;
  sortOrder: number;
  /** ISO 8601. Hora del último cambio en el dispositivo que lo hizo (resolución de conflictos). */
  updatedAt: string;
}

export interface CreateItemInput {
  /** Generado por el cliente para crear sin conexión; si falta, lo pone la base de datos. */
  id?: string;
  routineId: string;
  label: string;
  icon?: string | null;
  type?: string | null;
  critical?: boolean;
  note?: string | null;
  sortOrder?: number;
  /** Hora del cambio en el cliente; por defecto, el momento de inserción. */
  updatedAt?: string;
}

/** Un ítem no cambia de rutina. */
export type UpdateItemInput = Partial<Omit<CreateItemInput, 'id' | 'routineId' | 'updatedAt'>>;
