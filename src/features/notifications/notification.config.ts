import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  ACTION_LABELS,
  ARRIVAL_CHANNEL_NAME,
  ARRIVAL_SILENT_CHANNEL_NAME,
  CHANNEL_NAME,
  SILENT_CHANNEL_NAME,
  snoozeActionLabel,
} from './notification.copy';
import { loadNotificationPrefs } from './notification.prefs';

const CHANNEL_ID = 'routines';
// En Android 8+ el sonido lo decide el canal, no cada notificación: "Sonido" (11-5) elige canal.
const SILENT_CHANNEL_ID = 'routines-silent';
export const CATEGORY_ID = 'routine-check';
// Recordatorios de llegada a casa: su propio canal (se pueden silenciar aparte en Ajustes del sistema) y categoría.
const ARRIVAL_CHANNEL_ID = 'arrival-reminder';
const ARRIVAL_SILENT_CHANNEL_ID = 'arrival-reminder-silent';
export const ARRIVAL_CATEGORY_ID = 'arrival-reminder';

export const ACTION_VERIFY = 'verify';
export const ACTION_SNOOZE = 'snooze';
export const ACTION_SKIP = 'skip';
export const ACTION_DONE = 'done';

/** Documento de Contenido: "recordatorios sin respuesta: 2". */
export const UNANSWERED_REMINDERS = 2;

export const minutesToMs = (minutes: number) => minutes * 60_000;

export const channelFor = (sound: boolean) => (sound ? CHANNEL_ID : SILENT_CHANNEL_ID);
export const arrivalChannelFor = (sound: boolean) => (sound ? ARRIVAL_CHANNEL_ID : ARRIVAL_SILENT_CHANNEL_ID);

let setup: Promise<void> | null = null;

/** Presentación en primer plano y canales (Android). Idempotente. */
function ensureNotificationSetup(): Promise<void> {
  setup ??= (async () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        const { sound } = await loadNotificationPrefs();
        return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: sound, shouldSetBadge: false };
      },
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: CHANNEL_NAME,
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync(SILENT_CHANNEL_ID, {
        name: SILENT_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        enableVibrate: false,
      });
      await Notifications.setNotificationChannelAsync(ARRIVAL_CHANNEL_ID, {
        name: ARRIVAL_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync(ARRIVAL_SILENT_CHANNEL_ID, {
        name: ARRIVAL_SILENT_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        enableVibrate: false,
      });
    }
  })().catch((cause: unknown) => {
    setup = null; // Se reintenta en la próxima llamada.
    throw cause;
  });
  return setup;
}

/**
 * Acciones de la notificación. Orden fijo: Verificar · Posponer · Omitir; solo "Verificar" abre
 * la app. Se vuelve a registrar al cambiar "Posponer" en Ajustes para que el botón diga los minutos.
 */
export async function registerNotificationActions(snoozeMinutes: number) {
  // Llegada a casa: solo «Hecho», que no abre la app. Tocar el cuerpo abre la verificación.
  await Notifications.setNotificationCategoryAsync(ARRIVAL_CATEGORY_ID, [
    { identifier: ACTION_DONE, buttonTitle: ACTION_LABELS.done, options: { opensAppToForeground: false } },
  ]);
  return Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    { identifier: ACTION_VERIFY, buttonTitle: ACTION_LABELS.verify, options: { opensAppToForeground: true } },
    {
      identifier: ACTION_SNOOZE,
      buttonTitle: snoozeActionLabel(snoozeMinutes),
      options: { opensAppToForeground: false },
    },
    { identifier: ACTION_SKIP, buttonTitle: ACTION_LABELS.skip, options: { opensAppToForeground: false } },
  ]);
}

/**
 * Deja todo listo para mostrar avisos. En Android 13+ el diálogo de permiso no aparece hasta que
 * existe un canal, así que debe correr antes de pedirlo.
 */
export async function configureNotifications(): Promise<void> {
  await ensureNotificationSetup();
  await registerNotificationActions((await loadNotificationPrefs()).snoozeMinutes);
}
