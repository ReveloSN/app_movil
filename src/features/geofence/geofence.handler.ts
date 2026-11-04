import * as Location from 'expo-location';

import { handleArrivalDetected } from '@/features/notifications/arrival.service';

import { HOME_REGION_ID } from './geofence.service';

/** Lo que TaskManager entrega a una tarea de geocerca (ver Location.startGeofencingAsync). */
export interface GeofenceTaskBody {
  data?: { eventType?: Location.LocationGeofencingEventType; region?: { identifier?: string } } | null;
  error?: { message?: string } | null;
}

/**
 * Evento de la geocerca de casa. Solo ENTRAR cuenta: avisa la llegada por el mismo camino que el Wi-Fi.
 * SALIR se ignora. Nunca lanza (una tarea que falla puede quedar penalizada por el sistema) y no registra
 * la región ni ninguna ubicación. Devuelve cuántos avisos sonaron.
 */
export async function handleGeofenceEvent({ data, error }: GeofenceTaskBody, now: number = Date.now()): Promise<number> {
  if (error || !data) return 0;
  if (data.eventType !== Location.GeofencingEventType.Enter) return 0;
  if (data.region?.identifier && data.region.identifier !== HOME_REGION_ID) return 0;
  try {
    return await handleArrivalDetected('geofence', now);
  } catch (cause) {
    if (__DEV__) console.warn('[geofence.enter]', cause instanceof Error ? cause.name : 'error');
    return 0;
  }
}
