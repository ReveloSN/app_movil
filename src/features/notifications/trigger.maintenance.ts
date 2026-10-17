import { remoteRepositories } from '@/db/app.repositories';
import { getLocalStore } from '@/db/local/local.store';
import { migratePendingRecords } from '@/db/local/pendingSync.migration';
import { pushOutbox } from '@/db/sync/sync.push';
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
 * Solo usa datos locales:
 * 1. pasa la cola vieja de verificaciones a la outbox (una sola vez, tras actualizar la app),
 * 2. rellena las próximas veces de los avisos por horario,
 * 3. revisa si cambió la red Wi-Fi,
 * 4. registra como "sin respuesta" lo que venció sin respuesta (va a la outbox),
 * 5. solo desde la tarea en segundo plano (`push`): sube la outbox. Con la app abierta lo hace SyncProvider.
 */
export async function runTriggerMaintenance(now: number = Date.now(), options: { push?: boolean } = {}): Promise<void> {
  await migratePendingRecords().catch(warn('migratePending'));

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

  // Solo subir: bajar (y mezclar) se hace con la app abierta, donde se ven los cambios.
  if (options.push && snapshot) await pushOutbox(getLocalStore(snapshot.ownerId), remoteRepositories).catch(warn('push'));
}
