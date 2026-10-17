import '@/shared/network/netinfo.config';

import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { AppState } from 'react-native';

import type { SettingsRepository } from '@/db/repositories/settings.repository';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLocalRepositories } from '@/features/local-data/LocalRepositoriesProvider';
import { clearArmedTriggers, loadArmedTriggers, saveArmedTriggers } from '@/features/triggers/armedTriggers.store';
import { fetchArmedTriggers, type TriggerSyncDeps } from '@/features/triggers/trigger.sync';
import { clearLastSsid } from '@/features/triggers/wifi/wifiSnapshot.store';

import { registerBackgroundTasks } from './background.tasks';
import { configureNotifications, registerNotificationActions } from './notification.config';
import {
  clearNotificationPrefs,
  normalizeSnooze,
  saveNotificationPrefs,
  type NotificationPrefs,
} from './notification.prefs';
import { cancelAllOccurrences } from './occurrence.lifecycle';
import { runTriggerMaintenance } from './trigger.maintenance';
import { checkWifiTriggers } from './wifi.monitor';

interface TriggerRuntimeValue {
  /** Vuelve a leer los avisos de la copia local y reprograma (llamar tras guardar una rutina con avisos). */
  rearm(): Promise<void>;
  /** Aplica ya un cambio de Ajustes (P11): botón "Posponer N min", sonido y "No molestar". */
  applyPrefs(prefs: NotificationPrefs): Promise<void>;
}

const TriggerRuntimeContext = createContext<TriggerRuntimeValue | null>(null);

const warn = (scope: string) => (cause: unknown) => {
  if (__DEV__) console.warn(`[triggers.${scope}]`, cause);
};

async function disarm(): Promise<void> {
  await cancelAllOccurrences();
  await clearArmedTriggers();
  await clearLastSsid();
  await clearNotificationPrefs();
}

async function applyPrefs(prefs: NotificationPrefs): Promise<void> {
  await saveNotificationPrefs(prefs);
  await registerNotificationActions(prefs.snoozeMinutes);
  // Reprograma con los nuevos minutos/sonido, o cancela todo si se activó "No molestar".
  await runTriggerMaintenance();
}

/**
 * Mantiene los avisos funcionando mientras la app vive: los arma con la sesión, los desarma al
 * cerrarla, revisa al volver a primer plano y reacciona al instante a los cambios de red.
 * Con la app cerrada lo hacen las tareas de background.tasks.ts.
 */
export function TriggerRuntimeProvider({
  children,
  deps: injectedDeps,
  settings: injectedSettings,
}: {
  children: ReactNode;
  /** Inyectables para tests; por defecto, los repositorios locales del usuario. */
  deps?: TriggerSyncDeps;
  settings?: Pick<SettingsRepository, 'getAll'>;
}) {
  const local = useLocalRepositories();
  const deps = injectedDeps ?? local;
  const settings = injectedSettings ?? local.settings;
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    configureNotifications().catch(warn('configure'));
    registerBackgroundTasks().catch(warn('registerTasks'));
  }, []);

  const rearm = useCallback(async () => {
    if (!userId) return;
    const previous = await loadArmedTriggers();
    if (previous && previous.ownerId !== userId) await disarm();
    try {
      await saveArmedTriggers({ ownerId: userId, triggers: await fetchArmedTriggers(deps) });
      // Ajustes guardados en el teléfono. Sin fila, quedan los por defecto.
      const [row] = await settings.getAll();
      if (row) {
        const prefs = { snoozeMinutes: normalizeSnooze(row.snoozeMinutes), doNotDisturb: row.doNotDisturb, sound: row.sound };
        await saveNotificationPrefs(prefs);
        await registerNotificationActions(prefs.snoozeMinutes);
      }
    } catch (cause) {
      // Si no se pudo leer, se sigue con la copia armada anterior (si es de esta cuenta).
      warn('fetch')(cause);
    }
    await runTriggerMaintenance();
  }, [userId, deps, settings]);

  useEffect(() => {
    if (loading) return; // Durante la carga inicial la sesión aún es null: no es un cierre de sesión.
    if (userId) rearm().catch(warn('rearm'));
    else disarm().catch(warn('disarm'));
  }, [loading, userId, rearm]);

  useEffect(() => {
    if (!userId) return;
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') runTriggerMaintenance().catch(warn('maintenance'));
    });
    // En primer plano (y mientras Android mantenga viva la app) el cambio de red se nota al instante.
    const network = NetInfo.addEventListener(() => {
      checkWifiTriggers().catch(warn('wifi'));
    });
    return () => {
      appState.remove();
      network();
    };
  }, [userId]);

  const value = useMemo(() => ({ rearm, applyPrefs }), [rearm]);
  return <TriggerRuntimeContext.Provider value={value}>{children}</TriggerRuntimeContext.Provider>;
}

export function useTriggerRuntime(): TriggerRuntimeValue {
  const context = useContext(TriggerRuntimeContext);
  if (!context) throw new Error('useTriggerRuntime debe usarse dentro de <TriggerRuntimeProvider>.');
  return context;
}
