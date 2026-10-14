import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { loadArmedTriggers } from '@/features/triggers/armedTriggers.store';
import { createSerialQueue } from '@/shared/lib/serialQueue';

import { ACTION_SKIP, ACTION_SNOOZE, ACTION_VERIFY } from './notification.config';
import { loadNotificationPrefs } from './notification.prefs';
import { closeOccurrence, postponeOccurrence } from './occurrence.lifecycle';
import type { OccurrenceNotificationData } from './occurrence.types';
import { writeNotificationRecord } from './record.writer';

export type ResponseKind = 'verify' | 'snooze' | 'skip';

/** Tocar el cuerpo de la notificación equivale a "Verificar". */
export function responseKind(actionIdentifier: string): ResponseKind | null {
  if (actionIdentifier === ACTION_VERIFY || actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) return 'verify';
  if (actionIdentifier === ACTION_SNOOZE) return 'snooze';
  if (actionIdentifier === ACTION_SKIP) return 'skip';
  return null;
}

export function occurrenceData(response: Notifications.NotificationResponse): OccurrenceNotificationData | null {
  const data = response.notification.request.content.data as Partial<OccurrenceNotificationData> | null;
  return typeof data?.occurrenceKey === 'string' && typeof data.routineId === 'string'
    ? { occurrenceKey: data.occurrenceKey, routineId: data.routineId }
    : null;
}

// Android puede entregar la misma respuesta a la tarea en segundo plano y al listener de la app:
// posponer u omitir dos veces duplicaría el registro. Se recuerdan las últimas respuestas atendidas.
const HANDLED_KEY = 'handled-notification-responses';
const HANDLED_LIMIT = 50;
const serial = createSerialQueue();

function markHandled(responseId: string): Promise<boolean> {
  return serial(async () => {
    let handled: string[] = [];
    try {
      const parsed: unknown = JSON.parse((await AsyncStorage.getItem(HANDLED_KEY)) ?? '[]');
      if (Array.isArray(parsed)) handled = parsed.filter((id): id is string => typeof id === 'string');
    } catch {
      // Contenido corrupto: se empieza de cero.
    }
    if (handled.includes(responseId)) return false;
    await AsyncStorage.setItem(HANDLED_KEY, JSON.stringify([...handled, responseId].slice(-HANDLED_LIMIT)));
    return true;
  });
}

/**
 * Efectos de una respuesta, sin UI (sirven igual con la app cerrada):
 * - verify: la vez queda respondida (se cancelan sus recordatorios). Abrir P07 lo hace quien tenga navegación.
 * - snooze: reprograma según "Posponer" de Ajustes (2/5/10 min), sin registro.
 * - skip: registro "skipped".
 * Devuelve el tipo de respuesta y la rutina, o null si la notificación no es de una rutina.
 */
export async function applyNotificationResponse(
  response: Notifications.NotificationResponse,
  now: number = Date.now(),
): Promise<{ kind: ResponseKind; routineId: string } | null> {
  const kind = responseKind(response.actionIdentifier);
  const data = occurrenceData(response);
  if (!kind || !data) return null;

  if (kind === 'verify') {
    await closeOccurrence(data.occurrenceKey); // Idempotente: no necesita deduplicarse.
    return { kind, routineId: data.routineId };
  }

  const responseId = `${response.notification.request.identifier}|${response.actionIdentifier}|${response.notification.date}`;
  if (!(await markHandled(responseId))) return { kind, routineId: data.routineId };

  if (kind === 'snooze') {
    const snoozed = await postponeOccurrence(data.occurrenceKey, now, await loadNotificationPrefs());
    // Sin ocurrencia guardada (p. ej. datos borrados) solo se quita la notificación.
    if (!snoozed) await Notifications.dismissNotificationAsync(response.notification.request.identifier);
    return { kind, routineId: data.routineId };
  }

  const closed = await closeOccurrence(data.occurrenceKey);
  await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => undefined);
  // Sin ocurrencia guardada, el registro va a nombre de la cuenta dueña de los avisos armados.
  const ownerId = closed?.ownerId ?? (await loadArmedTriggers())?.ownerId;
  if (ownerId) await writeNotificationRecord(data.routineId, ownerId, 'skipped', now);
  return { kind, routineId: data.routineId };
}
