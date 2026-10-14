import type { IoniconName } from '@/shared/utils/ioniconName';

import type { PermissionKind, PermissionState } from './permission.types';

interface PermissionCopy {
  title: string;
  icon: IoniconName;
  /** Por qué se pide (ER-01 / ER-02). */
  reason: string;
}

export const PERMISSION_COPY: Record<PermissionKind, PermissionCopy> = {
  // ER-01
  notifications: {
    title: 'Notificaciones',
    icon: 'notifications-outline',
    reason: 'Activa las notificaciones para recibir tus rutinas.',
  },
  // ER-02
  location: {
    title: 'Ubicación',
    icon: 'location-outline',
    reason: 'Para detectar tu Wi-Fi, el teléfono pide acceso a la ubicación. No la guardamos.',
  },
};

// Textos de P02 sin código en el Documento de Contenido.
export function statusLabel(state: PermissionState | null): string {
  if (!state) return 'Revisando…';
  if (state.granted) return 'Permitido';
  return state.canAskAgain ? 'Aún no lo has permitido' : 'Bloqueado. Actívalo desde los ajustes del teléfono.';
}

export const ALLOW_LABEL = 'Permitir';
export const OPEN_SETTINGS_LABEL = 'Abrir ajustes';
export const CONTINUE_LABEL = 'Continuar';
export const PERMISSIONS_TITLE = 'Permisos';

export const BACKGROUND_LOCATION_TITLE = 'Avisos con la app cerrada';
export const BACKGROUND_LOCATION_REASON =
  'Para notar que saliste aunque la app esté cerrada, elige «Permitir todo el tiempo». Es opcional.';
export const BACKGROUND_LOCATION_ALLOW = 'Permitir todo el tiempo';

export const LOCATION_SERVICES_OFF = 'La ubicación del teléfono está apagada: actívala para detectar tu Wi-Fi.';
