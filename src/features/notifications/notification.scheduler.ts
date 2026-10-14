import * as Notifications from 'expo-notifications';

import { CATEGORY_ID, channelFor, minutesToMs, UNANSWERED_REMINDERS } from './notification.config';
import { notificationTitle, reminderBody } from './notification.copy';
import type { NotificationPrefs } from './notification.prefs';
import type { Occurrence, OccurrenceNotificationData } from './occurrence.types';

type OccurrenceBase = Omit<Occurrence, 'deadline' | 'notificationIds'>;
/** Lo que el programador necesita de Ajustes (P11). */
type SchedulePrefs = Pick<NotificationPrefs, 'snoozeMinutes' | 'sound'>;

const content = (occurrence: OccurrenceBase, body: string, prefs: SchedulePrefs): Notifications.NotificationContentInput => {
  const data: OccurrenceNotificationData = { occurrenceKey: occurrence.key, routineId: occurrence.routineId };
  return {
    title: notificationTitle(occurrence.routineName),
    body,
    data,
    categoryIdentifier: CATEGORY_ID,
    sound: prefs.sound, // iOS; en Android lo decide el canal.
  };
};

const atDate = (date: number, prefs: SchedulePrefs): Notifications.NotificationTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date,
  channelId: channelFor(prefs.sound),
});

/** Programa los recordatorios sin respuesta a partir de `base` (cada `snoozeMinutes`). */
async function scheduleReminders(
  occurrence: OccurrenceBase,
  base: number,
  idPrefix: string,
  prefs: SchedulePrefs,
): Promise<string[]> {
  const ids: string[] = [];
  for (let n = 1; n <= UNANSWERED_REMINDERS; n += 1) {
    ids.push(
      await Notifications.scheduleNotificationAsync({
        identifier: `${idPrefix}${n}`,
        content: content(occurrence, reminderBody(occurrence.itemCount, occurrence.routineName), prefs),
        trigger: atDate(base + n * minutesToMs(prefs.snoozeMinutes), prefs),
      }),
    );
  }
  return ids;
}

const deadlineAfter = (base: number, prefs: SchedulePrefs) =>
  base + (UNANSWERED_REMINDERS + 1) * minutesToMs(prefs.snoozeMinutes);

/**
 * Programa la notificación principal (en `occurrence.firesAt`, o ya si es ahora o antes) y sus
 * recordatorios sin respuesta. Devuelve la ocurrencia lista para guardar.
 */
export async function scheduleOccurrence(
  occurrence: OccurrenceBase,
  body: string,
  now: number,
  prefs: SchedulePrefs,
): Promise<Occurrence> {
  const immediate = occurrence.firesAt <= now;
  const headId = await Notifications.scheduleNotificationAsync({
    identifier: `${occurrence.key}#0`,
    content: content(occurrence, body, prefs),
    trigger: immediate ? { channelId: channelFor(prefs.sound) } : atDate(occurrence.firesAt, prefs),
  });
  const base = Math.max(occurrence.firesAt, now);
  const reminderIds = await scheduleReminders(occurrence, base, `${occurrence.key}#r`, prefs);
  return { ...occurrence, notificationIds: [headId, ...reminderIds], deadline: deadlineAfter(base, prefs) };
}

/** Cancela lo pendiente y quita de la bandeja lo ya mostrado. Tolerante a ids que ya no existen. */
export async function cancelOccurrenceNotifications(occurrence: Occurrence): Promise<void> {
  await Promise.allSettled(
    occurrence.notificationIds.flatMap((id) => [
      Notifications.cancelScheduledNotificationAsync(id),
      Notifications.dismissNotificationAsync(id),
    ]),
  );
}

/** Posponer: reemplaza lo pendiente por recordatorios desde ahora (el primero en `snoozeMinutes`). */
export async function snoozeOccurrence(occurrence: Occurrence, now: number, prefs: SchedulePrefs): Promise<Occurrence> {
  await cancelOccurrenceNotifications(occurrence);
  const ids = await scheduleReminders(occurrence, now, `${occurrence.key}#s${now}-`, prefs);
  return { ...occurrence, notificationIds: ids, deadline: deadlineAfter(now, prefs) };
}
