import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

import { MAX_HOME_RADIUS, MIN_HOME_RADIUS, type HomeGeofence } from './geofence.types';

/**
 * Casa de la geocerca, guardada solo en este teléfono y por usuario. Está a propósito fuera de `local-db`:
 * ese documento se sincroniza con Supabase y las coordenadas de casa no deben salir del teléfono.
 */
export const homeGeofenceKey = (userId: string) => `home-geofence:${userId}`;

const isCoordinate = (value: unknown, limit: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;

/** Devuelve la casa si el valor es válido; si no (dañado, radio fuera de rango), null. */
export function parseHomeGeofence(value: unknown): HomeGeofence | null {
  const home = value as Partial<HomeGeofence> | null;
  if (!home || !isCoordinate(home.latitude, 90) || !isCoordinate(home.longitude, 180)) return null;
  if (typeof home.radius !== 'number' || home.radius < MIN_HOME_RADIUS || home.radius > MAX_HOME_RADIUS) return null;
  return { latitude: home.latitude, longitude: home.longitude, radius: home.radius };
}

export async function loadHomeGeofence(userId: string, storage: KeyValueStorage = AsyncStorage): Promise<HomeGeofence | null> {
  const raw = await storage.getItem(homeGeofenceKey(userId));
  if (!raw) return null;
  try {
    return parseHomeGeofence(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveHomeGeofence(
  userId: string,
  home: HomeGeofence,
  storage: KeyValueStorage = AsyncStorage,
): Promise<void> {
  const valid = parseHomeGeofence(home);
  if (!valid) throw new Error('Casa no válida.');
  await storage.setItem(homeGeofenceKey(userId), JSON.stringify(valid));
}

export const clearHomeGeofence = (userId: string, storage: KeyValueStorage = AsyncStorage) =>
  storage.removeItem(homeGeofenceKey(userId));
