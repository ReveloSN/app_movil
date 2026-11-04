// Textos de «Casa» (Ajustes): la geocerca de casa para avisar al llegar.

import type { GeofenceStatus } from './geofence.types';

export const HOME_SECTION_TITLE = 'Casa';

export const HOME_INTRO =
  'Define dónde vives para que te avisemos al llegar, aunque la app esté cerrada. Las coordenadas de tu casa se guardan solo en este teléfono: no se envían a ningún lado.';

export const STATUS_TITLE: Record<GeofenceStatus, string> = {
  'no-home': 'Sin casa definida',
  active: 'Activa',
  'no-permission': 'Falta un permiso',
  inactive: 'Inactiva',
};

export const STATUS_DETAIL: Record<GeofenceStatus, string> = {
  'no-home': 'Mientras tanto, los avisos al llegar solo usan tu Wi-Fi.',
  active: 'Te avisamos al llegar a casa, incluso con la app cerrada.',
  'no-permission': 'Permite la ubicación «todo el tiempo» para detectar tu llegada. Mientras tanto, solo avisamos por Wi-Fi.',
  inactive: 'El teléfono no tiene la zona registrada. Revisa que la ubicación esté encendida y vuelve a abrir la app.',
};

export const USE_LOCATION_LABEL = 'Usar mi ubicación actual';
export const LOCATING_LABEL = 'Buscando tu ubicación…';
export const RADIUS_LABEL = 'Radio de tu casa';
export const radiusOptionLabel = (meters: number) => `${meters} m`;
export const RADIUS_HINT = 'Elige un radio mayor si vives en un edificio grande o la señal es floja.';
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
export const DETECTION_DELAY_NOTE =
  'Android puede tardar unos minutos en notar que llegaste. Si el Wi-Fi de casa también está configurado, lo que ocurra primero te avisa, una sola vez.';
