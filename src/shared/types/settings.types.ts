/** Ajustes del usuario: una fila por usuario, identificada por userId. */
export interface Settings {
  userId: string;
  doNotDisturb: boolean;
  snoozeMinutes: number;
  sound: boolean;
}

/** userId lo asigna la base de datos (auth.uid()). */
export type CreateSettingsInput = Partial<Omit<Settings, 'userId'>>;

export type UpdateSettingsInput = CreateSettingsInput;
