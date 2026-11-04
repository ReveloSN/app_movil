import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { GeofenceStatus, HomeGeofence } from './geofence.types';
import { loadHomeGeofence } from './homeGeofence.store';

/** Nombre de la tarea de TaskManager (definida en geofence.task.ts) y de la única región registrada. */
export const HOME_GEOFENCE_TASK = 'home-geofence';
export const HOME_REGION_ID = 'home';

const toRegion = (home: HomeGeofence): Location.LocationRegion => ({
  identifier: HOME_REGION_ID,
  latitude: home.latitude,
  longitude: home.longitude,
  radius: home.radius,
  notifyOnEnter: true,
  // La salida no hace nada: no se pide al sistema.
  notifyOnExit: false,
});

/**
 * Permisos para una geocerca real: ubicación «mientras se usa» y, además, «todo el tiempo» (segundo plano).
 * Sin el segundo, Android no entrega los eventos con la app cerrada.
 */
export async function hasGeofencePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  const [foreground, background] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
  ]);
  return foreground.granted && background.granted;
}

/** Quita la geocerca del sistema (sin casa, cierre de sesión o permiso retirado). Nunca lanza. */
export async function stopHomeGeofence(): Promise<void> {
  try {
    if (await Location.hasStartedGeofencingAsync(HOME_GEOFENCE_TASK)) await Location.stopGeofencingAsync(HOME_GEOFENCE_TASK);
  } catch {
    // Ya no estaba registrada o la tarea no existe: es lo que se quería.
  }
}

/**
 * Registra (o vuelve a registrar, reemplazando) la región de casa del usuario. Sin casa o sin permisos no
 * registra nada y deja sola la detección por Wi-Fi: nunca lanza, devuelve el estado para mostrarlo.
 * Las coordenadas no se escriben en ningún log.
 */
export async function registerHomeGeofence(userId: string): Promise<GeofenceStatus> {
  try {
    const home = await loadHomeGeofence(userId);
    if (!home) {
      await stopHomeGeofence();
      return 'no-home';
    }
    if (!(await hasGeofencePermissions())) {
      await stopHomeGeofence();
      return 'no-permission';
    }
    if (!(await Location.hasServicesEnabledAsync())) return 'inactive';
    await Location.startGeofencingAsync(HOME_GEOFENCE_TASK, [toRegion(home)]);
    return 'active';
  } catch (cause) {
    // Sin el error completo: el de la plataforma podría incluir la región.
    if (__DEV__) console.warn('[geofence.register]', cause instanceof Error ? cause.name : 'error');
    return 'inactive';
  }
}

/**
 * Al abrir la app y en el mantenimiento: si hay casa y la geocerca no está registrada (Android las borra al
 * reiniciar el teléfono o actualizar Google Play), la vuelve a registrar. Si ya lo está, no la toca.
 */
export async function ensureHomeGeofence(userId: string): Promise<GeofenceStatus> {
  try {
    if (await Location.hasStartedGeofencingAsync(HOME_GEOFENCE_TASK)) {
      // Registrada, pero la casa pudo quitarse o el permiso retirarse mientras tanto.
      if ((await loadHomeGeofence(userId)) && (await hasGeofencePermissions())) return 'active';
    }
  } catch {
    // Se intenta registrar de nuevo.
  }
  return registerHomeGeofence(userId);
}

/** Estado actual para Ajustes, sin cambiar nada. */
export async function readGeofenceStatus(userId: string): Promise<GeofenceStatus> {
  try {
    if (!(await loadHomeGeofence(userId))) return 'no-home';
    if (!(await hasGeofencePermissions())) return 'no-permission';
    return (await Location.hasStartedGeofencingAsync(HOME_GEOFENCE_TASK)) ? 'active' : 'inactive';
  } catch {
    return 'inactive';
  }
}
