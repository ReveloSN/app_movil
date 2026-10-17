/** Ajustes del usuario: una fila por usuario, identificada por userId. */
export interface Settings {
  userId: string;
  doNotDisturb: boolean;
  snoozeMinutes: number;
  sound: boolean;
  /** Nombre de la persona para el saludo de Inicio (opcional, máx. 24). null = sin nombre. */
  displayName: string | null;
  /** ISO 8601. Hora del último cambio en el dispositivo que lo hizo (resolución de conflictos). */
  updatedAt: string;
}

/** userId lo asigna la base de datos (auth.uid()). updatedAt: hora del cambio en el cliente (por defecto, la de inserción). */
export type CreateSettingsInput = Partial<Omit<Settings, 'userId'>>;

export type UpdateSettingsInput = Omit<CreateSettingsInput, 'updatedAt'>;
