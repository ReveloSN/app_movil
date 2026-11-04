import { loadArmedTriggers } from '@/features/triggers/armedTriggers.store';
import { isWithinWindow } from '@/features/triggers/strategies/wifi.strategy';
import type { ArmedTrigger, ArrivalRoutine } from '@/features/triggers/trigger.types';

import { loadNotificationPrefs, type NotificationPrefs } from './notification.prefs';
import { fireArrival, type ArrivalTarget } from './occurrence.lifecycle';

export type ArrivalSource = 'wifi' | 'geofence';

export const toArrivalTarget = ({ routineId, routineName, itemLabels }: Pick<ArmedTrigger, 'routineId' | 'routineName' | 'itemLabels'>): ArrivalTarget => ({
  routineId,
  routineName,
  itemLabels,
});

/**
 * ¿La rutina de llegada avisa a esta hora? Sin avisos de «Llegar al Wi-Fi», o con alguno sin franja, avisa
 * siempre; si todos tienen franja, solo dentro de alguna (la geocerca respeta lo mismo que el Wi-Fi).
 */
export const arrivalAllowedAt = (arrival: Pick<ArrivalRoutine, 'windows'>, at: Date): boolean =>
  arrival.windows.length === 0 || arrival.windows.some((window) => isWithinWindow(window, at));

/**
 * La persona llegó a casa según la geocerca: avisa cada rutina de llegada activa que toque a esta hora.
 * Usa `fireArrival`, el mismo camino del Wi-Fi, así que el cooldown de 10 minutos evita avisar dos veces la
 * misma llegada. Funciona con la app cerrada (solo lee copias locales). Devuelve cuántas sonaron.
 * `source` queda para depurar y no se guarda en ningún lado.
 */
export async function handleArrivalDetected(
  _source: ArrivalSource,
  now: number = Date.now(),
  prefs?: NotificationPrefs,
): Promise<number> {
  const snapshot = await loadArmedTriggers();
  if (!snapshot?.arrivals?.length) return 0;
  const currentPrefs = prefs ?? (await loadNotificationPrefs());
  let fired = 0;
  for (const arrival of snapshot.arrivals) {
    if (!arrivalAllowedAt(arrival, new Date(now))) continue;
    if (await fireArrival(arrival, snapshot.ownerId, now, currentPrefs)) fired += 1;
  }
  return fired;
}
