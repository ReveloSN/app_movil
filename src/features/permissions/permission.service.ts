import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { configureNotifications } from '@/features/notifications/notification.config';

import type { PermissionKind, PermissionState } from './permission.types';

const toState = ({ granted, canAskAgain }: { granted: boolean; canAskAgain: boolean }): PermissionState => ({
  granted,
  canAskAgain,
});

export async function getPermission(kind: PermissionKind): Promise<PermissionState> {
  if (kind === 'notifications') return toState(await Notifications.getPermissionsAsync());
  return toState(await Location.getForegroundPermissionsAsync());
}

export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
  if (kind === 'notifications') {
    // Android 13+: sin un canal creado, el sistema no muestra el diálogo.
    await configureNotifications();
    return toState(await Notifications.requestPermissionsAsync());
  }
  return toState(await Location.requestForegroundPermissionsAsync());
}

/**
 * "Permitir todo el tiempo": en Android 10+ es lo que deja leer el nombre del Wi-Fi desde la tarea
 * en segundo plano. Solo se puede pedir con la ubicación "mientras se usa" ya concedida.
 */
export const getBackgroundLocation = async () => toState(await Location.getBackgroundPermissionsAsync());
export const requestBackgroundLocation = async () => toState(await Location.requestBackgroundPermissionsAsync());

/** Android exige además la ubicación del teléfono encendida para entregar el SSID. */
export const isLocationServiceEnabled = () =>
  Platform.OS === 'android' ? Location.hasServicesEnabledAsync() : Promise.resolve(true);

/** Primer permiso que falta de la lista, en orden; null si están todos. */
export async function firstMissingPermission(kinds: readonly PermissionKind[]): Promise<PermissionKind | null> {
  for (const kind of kinds) {
    if (!(await getPermission(kind)).granted) return kind;
  }
  return null;
}
