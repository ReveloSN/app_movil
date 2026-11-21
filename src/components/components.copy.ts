// Textos por defecto y etiquetas de accesibilidad de los componentes compartidos.

import { localized } from '@/shared/i18n/localized';

export default localized(
  {
    LOADING_LABEL: 'Cargando',
    RETRY_LABEL: 'Reintentar',
    OFFLINE_MESSAGE: 'Sin conexión a internet',
    counterLabel: (length: number, max: number) => `${length} de ${max} caracteres`,
    DAYS_LABEL: 'Días',
    networkNameLabel: (ssid: string) => `Nombre de «${ssid}»`,
    networkRowLabel: (name: string, ssid: string, lastSeen: string, usage: string) =>
      `${name}, red ${ssid}. ${lastSeen}. ${usage}.`,
    todayAt: (time: string) => `Hoy, ${time}`,
    lastTimeAt: (when: string) => `Última vez: ${when}`,
    NEVER_COMPLETED: 'Aún no la has completado',
    PAUSED_LABEL: 'Pausada',
    EDIT_LABEL: 'Editar',
    BACK_LABEL: 'Volver',
    CHANGE_TIME_HINT: 'Cambia la hora',
    EDIT_TRIGGER_HINT: 'Edita el aviso',
    removeTriggerLabel: (summary: string) => `Quitar aviso: ${summary}`,
  },
  {
    LOADING_LABEL: 'Loading',
    RETRY_LABEL: 'Retry',
    OFFLINE_MESSAGE: 'No internet connection',
    counterLabel: (length: number, max: number) => `${length} of ${max} characters`,
    DAYS_LABEL: 'Days',
    networkNameLabel: (ssid: string) => `Name for "${ssid}"`,
    networkRowLabel: (name: string, ssid: string, lastSeen: string, usage: string) =>
      `${name}, network ${ssid}. ${lastSeen}. ${usage}.`,
    todayAt: (time: string) => `Today, ${time}`,
    lastTimeAt: (when: string) => `Last time: ${when}`,
    NEVER_COMPLETED: "You haven't completed it yet",
    PAUSED_LABEL: 'Paused',
    EDIT_LABEL: 'Edit',
    BACK_LABEL: 'Back',
    CHANGE_TIME_HINT: 'Changes the time',
    EDIT_TRIGGER_HINT: 'Edits the alert',
    removeTriggerLabel: (summary: string) => `Remove alert: ${summary}`,
  },
);
