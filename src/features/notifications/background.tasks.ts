import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { applyNotificationResponse } from './notification.actions';
import { runTriggerMaintenance } from './trigger.maintenance';

/**
 * Tareas en segundo plano. Este módulo debe importarse en el arranque (app/_layout.tsx): Android
 * carga el bundle sin UI para ejecutarlas y la definición tiene que existir en ese momento.
 */
const NOTIFICATION_RESPONSE_TASK = 'notification-response';
const TRIGGER_MAINTENANCE_TASK = 'trigger-maintenance';

/** Mínimo que permite Android (WorkManager). El sistema puede correrla bastante más tarde. */
const MAINTENANCE_INTERVAL_MINUTES = 15;

// Android: corre al tocar "Posponer" u "Omitir" con la app en segundo plano o cerrada.
TaskManager.defineTask<Notifications.NotificationTaskPayload>(NOTIFICATION_RESPONSE_TASK, async ({ data, error }) => {
  if (error || !data || !('actionIdentifier' in data)) return;
  try {
    await applyNotificationResponse(data);
  } catch (cause) {
    if (__DEV__) console.warn('[notifications.backgroundResponse]', cause);
  }
});

// Chequeo periódico: Wi-Fi, próximos horarios y "sin respuesta".
TaskManager.defineTask(TRIGGER_MAINTENANCE_TASK, async () => {
  try {
    await runTriggerMaintenance();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (cause) {
    if (__DEV__) console.warn('[triggers.backgroundMaintenance]', cause);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundTasks(): Promise<void> {
  await Notifications.registerTaskAsync(NOTIFICATION_RESPONSE_TASK);
  if ((await BackgroundTask.getStatusAsync()) === BackgroundTask.BackgroundTaskStatus.Restricted) return;
  if (await TaskManager.isTaskRegisteredAsync(TRIGGER_MAINTENANCE_TASK)) return;
  await BackgroundTask.registerTaskAsync(TRIGGER_MAINTENANCE_TASK, { minimumInterval: MAINTENANCE_INTERVAL_MINUTES });
}

export async function unregisterBackgroundTasks(): Promise<void> {
  await Notifications.unregisterTaskAsync(NOTIFICATION_RESPONSE_TASK).catch(() => undefined);
  if (await TaskManager.isTaskRegisteredAsync(TRIGGER_MAINTENANCE_TASK)) {
    await BackgroundTask.unregisterTaskAsync(TRIGGER_MAINTENANCE_TASK);
  }
}
