export interface HomeNetwork {
  id: string;
  userId: string;
  displayName: string;
  ssid: string;
  place: string | null;
  /** ISO 8601. Hora del último cambio en el dispositivo que lo hizo (resolución de conflictos). */
  updatedAt: string;
}

export interface CreateHomeNetworkInput {
  /** Generado por el cliente para crear sin conexión; si falta, lo pone la base de datos. */
  id?: string;
  displayName: string;
  ssid: string;
  place?: string | null;
  /** Hora del cambio en el cliente; por defecto, el momento de inserción. */
  updatedAt?: string;
}

export type UpdateHomeNetworkInput = Partial<Omit<CreateHomeNetworkInput, 'id' | 'updatedAt'>>;
