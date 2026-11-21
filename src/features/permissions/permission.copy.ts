import { localized } from '@/shared/i18n/localized';
import type { IoniconName } from '@/shared/utils/ioniconName';

import type { PermissionKind, PermissionState } from './permission.types';

/** Ícono de cada permiso. Aparte de los textos: no es texto y debe conservar su tipo de ícono. */
export const PERMISSION_ICON: Record<PermissionKind, IoniconName> = {
  notifications: 'notifications-outline',
  location: 'location-outline',
};

interface PermissionCopy {
  title: string;
  /** Por qué se pide (ER-01 / ER-02). */
  reason: string;
}

const permissionsEs: Record<PermissionKind, PermissionCopy> = {
  // ER-01
  notifications: {
    title: 'Notificaciones',
    reason: 'Activa las notificaciones para recibir tus rutinas.',
  },
  // ER-02
  location: {
    title: 'Ubicación',
    reason:
      'Para detectar tu Wi-Fi y, si quieres, tu casa, el teléfono pide acceso a la ubicación. La ubicación de tu casa se guarda solo en este teléfono y no se envía a ningún lado.',
  },
};

const permissionsEn: Record<PermissionKind, PermissionCopy> = {
  notifications: {
    title: 'Notifications',
    reason: 'Turn on notifications to get your routines.',
  },
  location: {
    title: 'Location',
    reason:
      "To detect your Wi-Fi and, if you want, your home, the phone asks for location access. Your home's location is saved only on this phone and is never sent anywhere.",
  },
};

export default localized(
  {
    PERMISSION_COPY: permissionsEs,

    // Textos de P02 sin código en el Documento de Contenido.
    statusLabel: (state: PermissionState | null): string => {
      if (!state) return 'Revisando…';
      if (state.granted) return 'Permitido';
      return state.canAskAgain ? 'Aún no lo has permitido' : 'Bloqueado. Actívalo desde los ajustes del teléfono.';
    },
    /** "Estado: Permitido" para el lector de pantalla. */
    statusSpoken: (status: string) => `Estado: ${status}`,

    ALLOW_LABEL: 'Permitir',
    OPEN_SETTINGS_LABEL: 'Abrir ajustes',
    CONTINUE_LABEL: 'Continuar',
    PERMISSIONS_TITLE: 'Permisos',

    BACKGROUND_LOCATION_TITLE: 'Avisos con la app cerrada',
    BACKGROUND_LOCATION_REASON:
      'Para notar que saliste o llegaste a casa aunque la app esté cerrada, elige «Permitir todo el tiempo». Es opcional: sin él, solo avisamos por Wi-Fi. No enviamos tu ubicación a ningún lado.',
    BACKGROUND_LOCATION_ALLOW: 'Permitir todo el tiempo',

    LOCATION_SERVICES_OFF: 'La ubicación del teléfono está apagada: actívala para detectar tu Wi-Fi.',
  },
  {
    PERMISSION_COPY: permissionsEn,

    statusLabel: (state: PermissionState | null): string => {
      if (!state) return 'Checking…';
      if (state.granted) return 'Allowed';
      return state.canAskAgain ? "You haven't allowed it yet" : 'Blocked. Turn it on in your phone settings.';
    },
    statusSpoken: (status: string) => `Status: ${status}`,

    ALLOW_LABEL: 'Allow',
    OPEN_SETTINGS_LABEL: 'Open settings',
    CONTINUE_LABEL: 'Continue',
    PERMISSIONS_TITLE: 'Permissions',

    BACKGROUND_LOCATION_TITLE: 'Alerts with the app closed',
    BACKGROUND_LOCATION_REASON:
      'To notice when you leave or get home even with the app closed, choose “Allow all the time”. It is optional: without it, we only alert you through Wi-Fi. We never send your location anywhere.',
    BACKGROUND_LOCATION_ALLOW: 'Allow all the time',

    LOCATION_SERVICES_OFF: "Your phone's location is off: turn it on to detect your Wi-Fi.",
  },
);
