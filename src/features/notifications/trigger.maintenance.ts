import { appRepositories } from '@/db/app.repositories';
import { flush } from '@/features/checklist/pendingSync';
import { loadArmedTriggers } from '@/features/triggers/armedTriggers.store';

import { loadNotificationPrefs } from './notification.prefs';
import { syncScheduledOccurrences, takeUnanswered } from './occurrence.lifecycle';
import { writeNotificationRecord } from './record.writer';
import { checkWifiTriggers } from './wifi.monitor';

const warn = (scope: string) => (cause: unknown) => {
  if (__DEV__) console.warn(`[triggers.${scope}]`, cause);
};

/**
 * Lo que hay que revisar cada tanto, con la app abierta o desde la tarea en segundo plano.
 * Solo usa datos locales (más la red para enviar registros, si la hay):
 * 1. rellena las próximas veces de los avisos por horario,
 * 2. revisa si cambió la red Wi-Fi,
 * 3. registra como "sin respuesta" lo que venció sin respuesta,
 * 4. envía los registros pendientes.
 */
export async function runTriggerMaintenance(now: number = Date.now()): Promise<void> {
  const snapshot = await loadArmedTriggers();
  const prefs = await loadNotificationPrefs();
  if (snapshot) await syncScheduledOccurrences(snapshot, now, prefs).catch(warn('schedule'));

  await checkWifiTriggers(now).catch(warn('wifi'));

  const unanswered = await takeUnanswered(now);
  for (const occurrence of unanswered) {
    await writeNotificationRecord(occurrence.routineId, occurrence.ownerId, 'no_response', occurrence.deadline).catch(
      warn('noResponse'),
    );
  }

  if (snapshot) await flush(snapshot.ownerId, appRepositories.records).catch(warn('flush'));
}
