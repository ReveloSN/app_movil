/**
 * Casa para la geocerca: centro y radio en metros. Vive SOLO en el teléfono (AsyncStorage, por usuario):
 * no entra al documento sincronizado, ni a la cola de cambios, ni a Supabase.
 */
export interface HomeGeofence {
  latitude: number;
  longitude: number;
  /** Metros. Uno de HOME_RADII_METERS. */
  radius: number;
}

/** Radios que puede elegir la persona. Android no detecta bien geocercas de menos de ~100 m. */
export const HOME_RADII_METERS = [150, 250, 400] as const;
export const DEFAULT_HOME_RADIUS = 250;
export const MIN_HOME_RADIUS = 100;
export const MAX_HOME_RADIUS = 1000;

/** Estado de la detección por geocerca, para mostrarlo en Ajustes. */
export type GeofenceStatus =
  /** Sin casa guardada. */
  | 'no-home'
  /** Casa guardada y la geocerca registrada en el sistema. */
  | 'active'
  /** Casa guardada pero falta un permiso: solo funciona el aviso por Wi-Fi. */
  | 'no-permission'
  /** Casa guardada, permisos listos, pero el sistema no la registró (ubicación apagada, error). */
  | 'inactive';
