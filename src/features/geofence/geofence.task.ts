import * as TaskManager from 'expo-task-manager';

import { handleGeofenceEvent } from './geofence.handler';
import { HOME_GEOFENCE_TASK } from './geofence.service';

/**
 * Tarea de la geocerca de casa. Debe definirse al cargar el bundle (se importa desde background.tasks.ts,
 * que carga el arranque): Android lo arranca sin interfaz cuando el sistema detecta que llegaste.
 */
TaskManager.defineTask(HOME_GEOFENCE_TASK, async (body) => {
  await handleGeofenceEvent(body as Parameters<typeof handleGeofenceEvent>[0]);
});
