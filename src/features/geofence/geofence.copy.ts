// Textos de «Casa» (Ajustes): la geocerca de casa para avisar al llegar.

import type { GeofenceStatus } from './geofence.types';

export const HOME_SECTION_TITLE = 'Casa';

export const HOME_INTRO = 'Te avisamos al llegar a casa. Tu ubicación no sale de este teléfono.';

export const STATUS_TITLE: Record<GeofenceStatus, string> = {
  'no-home': 'Sin casa definida',
  'no-arrival': 'Sin rutina de llegada',
  active: 'Activa',
  'no-permission': 'Falta un permiso',
  inactive: 'Inactiva',
};

export const STATUS_DETAIL: Record<GeofenceStatus, string> = {
  'no-home': 'Defínela para que te avisemos al llegar.',
  'no-arrival': 'Crea una rutina de llegada para activarla.',
  active: 'Lista para avisarte, incluso con la app cerrada.',
  'no-permission': 'Permite la ubicación «todo el tiempo».',
  inactive: 'Enciende la ubicación y abre la app de nuevo.',
};

export const USE_LOCATION_LABEL = 'Usar mi ubicación actual';
export const LOCATING_LABEL = 'Buscando tu ubicación…';
export const RADIUS_LABEL = 'Radio de tu casa';
export const radiusOptionLabel = (meters: number) => `${meters} m`;
export const RADIUS_HINT = 'Más radio si vives en un edificio grande.';
export const REMOVE_HOME_LABEL = 'Quitar casa';
export const ALLOW_BACKGROUND_LABEL = 'Permitir ubicación todo el tiempo';
export const ALLOW_LOCATION_LABEL = 'Permitir ubicación';

export const HOME_SAVED = 'Casa guardada en este teléfono.';
export const HOME_REMOVED = 'Quitaste tu casa. Borramos sus coordenadas del teléfono.';
export const LOCATION_UNAVAILABLE =
  'No pudimos obtener tu ubicación. Revisa que esté encendida y prueba de nuevo, mejor junto a una ventana o al aire libre.';
export const LOCATION_PERMISSION_NEEDED = 'Para usar tu ubicación actual, permite el acceso a la ubicación.';
export const SAVE_FAILED = 'No pudimos guardar tu casa. Inténtalo de nuevo.';

/** Sobre la demora en Android: la detección no es instantánea. */
export const DETECTION_DELAY_NOTE = 'Android puede tardar unos minutos en avisarte.';
