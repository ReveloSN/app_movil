import type { ArmedTriggersSnapshot } from '@/features/triggers/armedTriggers.store';
import { strategyFor } from '@/features/triggers/strategies';
import type { ArmedTrigger } from '@/features/triggers/trigger.types';

import { triggerBody } from './notification.copy';
import type { NotificationPrefs } from './notification.prefs';
import { cancelOccurrenceNotifications, scheduleOccurrence, snoozeOccurrence } from './notification.scheduler';
import { updateOccurrences } from './occurrence.store';
import type { Occurrence } from './occurrence.types';

/**
 * Los horarios se programan como fechas concretas (no repeticiones) para que cada vez tenga sus
 * propios recordatorios. Se rellenan al abrir la app y desde la tarea en segundo plano.
 */
const SCHEDULE_HORIZON_DAYS = 4;
/** Un aviso de Wi-Fi no vuelve a sonar antes de esto (evita repetir si la señal parpadea). */
const WIFI_COOLDOWN_MS = 10 * 60_000;

const DAY_MS = 24 * 60 * 60_000;

// Incluye lo de Ajustes que cambia la notificación: cambiar "Posponer" o "Sonido" reprograma lo futuro.
const signatureOf = (armed: ArmedTrigger, prefs: NotificationPrefs) => {
  const { triggerId: _triggerId, routineId: _routineId, ...config } = armed;
  return JSON.stringify({ config, snoozeMinutes: prefs.snoozeMinutes, sound: prefs.sound });
};

const baseFor = (armed: ArmedTrigger, ownerId: string, firesAt: number, prefs: NotificationPrefs) => ({
  key: `${armed.triggerId}@${firesAt}`,
  triggerId: armed.triggerId,
  routineId: armed.routineId,
  routineName: armed.routineName,
  itemCount: armed.itemLabels.length,
  ownerId,
  firesAt,
  signature: signatureOf(armed, prefs),
});

const bodyFor = (armed: ArmedTrigger) => triggerBody(strategyFor(armed).notificationLead(armed), armed.itemLabels);

/**
 * Deja programadas las próximas veces de los avisos por horario: cancela las futuras de avisos
 * que ya no existen o cambiaron, y agrega las que falten dentro del horizonte.
 * Con "No molestar" (11-3) cancela todo, incluidos los recordatorios pendientes, y no programa nada.
 */
export function syncScheduledOccurrences(
  snapshot: ArmedTriggersSnapshot,
  now: number,
  prefs: NotificationPrefs,
): Promise<void> {
  return updateOccurrences(async (entries) => {
    if (prefs.doNotDisturb) {
      // Lo silenciado no se registra como "sin respuesta": la persona no llegó a verlo.
      await Promise.allSettled(entries.map(cancelOccurrenceNotifications));
      return { entries: [], result: undefined };
    }

    const armedById = new Map(snapshot.triggers.map((armed) => [armed.triggerId, armed]));
    const kept: Occurrence[] = [];
    for (const entry of entries) {
      const armed = armedById.get(entry.triggerId);
      const stale = entry.firesAt > now && (!armed || signatureOf(armed, prefs) !== entry.signature);
      if (stale) await cancelOccurrenceNotifications(entry);
      else kept.push(entry);
    }

    const keys = new Set(kept.map((entry) => entry.key));
    const until = new Date(now + SCHEDULE_HORIZON_DAYS * DAY_MS);
    for (const armed of snapshot.triggers) {
      for (const date of strategyFor(armed).occurrencesBetween(armed, new Date(now), until)) {
        const base = baseFor(armed, snapshot.ownerId, date.getTime(), prefs);
        if (keys.has(base.key)) continue;
        kept.push(await scheduleOccurrence(base, bodyFor(armed), now, prefs));
      }
    }
    return { entries: kept, result: undefined };
  });
}

/** Hace sonar un aviso ahora (Wi-Fi). Devuelve false si sonó hace muy poco o si está en "No molestar". */
export function fireTriggerNow(
  armed: ArmedTrigger,
  ownerId: string,
  now: number,
  prefs: NotificationPrefs,
): Promise<boolean> {
  return updateOccurrences(async (entries) => {
    if (prefs.doNotDisturb) return { entries, result: false };
    const recent = entries.some((entry) => entry.triggerId === armed.triggerId && entry.firesAt > now - WIFI_COOLDOWN_MS);
    if (recent) return { entries, result: false };
    const occurrence = await scheduleOccurrence(baseFor(armed, ownerId, now, prefs), bodyFor(armed), now, prefs);
    return { entries: [...entries, occurrence], result: true };
  });
}

/** Cierra una ocurrencia (respondida): cancela sus recordatorios. Devuelve la que se cerró, si existía. */
export function closeOccurrence(key: string): Promise<Occurrence | null> {
  return updateOccurrences(async (entries) => {
    const target = entries.find((entry) => entry.key === key) ?? null;
    if (target) await cancelOccurrenceNotifications(target);
    return { entries: entries.filter((entry) => entry !== target), result: target };
  });
}

/** Posponer: reprograma desde ahora. null si la ocurrencia ya no existe. */
export function postponeOccurrence(key: string, now: number, prefs: NotificationPrefs): Promise<Occurrence | null> {
  return updateOccurrences(async (entries) => {
    const target = entries.find((entry) => entry.key === key);
    if (!target) return { entries, result: null };
    if (prefs.doNotDisturb) {
      // Con "No molestar" no se reprograma: la vez queda cerrada sin más avisos.
      await cancelOccurrenceNotifications(target);
      return { entries: entries.filter((entry) => entry !== target), result: target };
    }
    const snoozed = await snoozeOccurrence(target, now, prefs);
    return { entries: entries.map((entry) => (entry === target ? snoozed : entry)), result: snoozed };
  });
}

/**
 * Al terminar una verificación desde la app (aunque no se haya entrado por la notificación),
 * las veces ya sonadas de esa rutina quedan respondidas: no deben acabar como "sin respuesta".
 */
export function closeRoutineOccurrences(routineId: string, now: number): Promise<void> {
  return updateOccurrences(async (entries) => {
    const answered = entries.filter((entry) => entry.routineId === routineId && entry.firesAt <= now);
    await Promise.allSettled(answered.map(cancelOccurrenceNotifications));
    return { entries: entries.filter((entry) => !answered.includes(entry)), result: undefined };
  });
}

/** Rutina eliminada: cancela todo lo suyo (pasado y futuro), sin registrar "sin respuesta". */
export function cancelRoutineOccurrences(routineId: string): Promise<void> {
  return updateOccurrences(async (entries) => {
    const owned = entries.filter((entry) => entry.routineId === routineId);
    await Promise.allSettled(owned.map(cancelOccurrenceNotifications));
    return { entries: entries.filter((entry) => !owned.includes(entry)), result: undefined };
  });
}

/** Quita y devuelve las ocurrencias vencidas sin respuesta (para registrarlas como "no_response"). */
export function takeUnanswered(now: number): Promise<Occurrence[]> {
  return updateOccurrences(async (entries) => {
    const expired = entries.filter((entry) => entry.deadline <= now);
    return { entries: entries.filter((entry) => !expired.includes(entry)), result: expired };
  });
}

/** Al cerrar sesión: nada de esta cuenta debe seguir sonando. */
export function cancelAllOccurrences(): Promise<void> {
  return updateOccurrences(async (entries) => {
    await Promise.allSettled(entries.map(cancelOccurrenceNotifications));
    return { entries: [], result: undefined };
  });
}
