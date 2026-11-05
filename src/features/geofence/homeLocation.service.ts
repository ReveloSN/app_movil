import * as Location from 'expo-location';

import { DEFAULT_HOME_RADIUS, type HomeGeofence } from './geofence.types';

/** Si el GPS no responde en este tiempo, se avisa en vez de dejar el botón cargando para siempre. */
const LOCATE_TIMEOUT_MS = 20_000;

export type LocateResult =
  | { status: 'ok'; home: HomeGeofence }
  /** Falta el permiso de ubicación «mientras se usa la app». */
  | { status: 'no-permission' }
  /** El teléfono no pudo dar la posición (ubicación apagada, sin señal, tiempo agotado). */
  | { status: 'unavailable' };

/**
 * «Usar mi ubicación actual»: lee la posición una sola vez. Las coordenadas no se registran en logs ni
 * se envían a ningún lado: quien llama las guarda en el teléfono.
 */
export async function locateHome(radius: number = DEFAULT_HOME_RADIUS): Promise<LocateResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!(await Location.getForegroundPermissionsAsync()).granted) return { status: 'no-permission' };
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), LOCATE_TIMEOUT_MS);
      }),
    ]);
    return { status: 'ok', home: { latitude: position.coords.latitude, longitude: position.coords.longitude, radius } };
  } catch {
    // Sin detalles a propósito: el error de la plataforma podría traer coordenadas.
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}
