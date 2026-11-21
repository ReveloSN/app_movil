import { ensureNotificationChannels, registerNotificationActions } from './notification.config';
import { loadNotificationPrefs } from './notification.prefs';
import { runTriggerMaintenance } from './trigger.maintenance';

const warn = (scope: string) => (cause: unknown) => {
  if (__DEV__) console.warn(`[notifications.language.${scope}]`, cause);
};

/**
 * Aplica el idioma activo a lo que Android guarda con texto armado. Se llama después de cambiar el idioma:
 * 1. renombra los canales (el nombre se ve en los ajustes del sistema),
 * 2. vuelve a registrar los botones de las notificaciones (Verificar · Posponer N min · Omitir · Hecho),
 * 3. reprograma lo que ya estaba programado: la firma de cada vez incluye el idioma, así que el mantenimiento
 *    cancela lo futuro con el texto viejo y lo vuelve a crear con el nuevo.
 * Cada paso tolera su error por separado: que falle uno no deja sin hacer los demás.
 */
export async function applyNotificationLanguage(): Promise<void> {
  await ensureNotificationChannels().catch(warn('channels'));
  await loadNotificationPrefs()
    .then((prefs) => registerNotificationActions(prefs.snoozeMinutes))
    .catch(warn('actions'));
  await runTriggerMaintenance().catch(warn('maintenance'));
}
