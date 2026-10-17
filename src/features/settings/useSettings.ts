import { useCallback, useEffect, useRef, useState } from 'react';

import type { SettingsRepository } from '@/db/repositories/settings.repository';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLocalRepositories, useLocalStore } from '@/features/local-data/LocalRepositoriesProvider';
import { normalizeSnooze } from '@/features/notifications/notification.prefs';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import type { Settings, UpdateSettingsInput } from '@/shared/types/settings.types';

import { SETTINGS_LOAD_ERROR, SETTINGS_SAVE_ERROR } from './settings.copy';
import { loadOrCreateSettings } from './settings.service';

type Repository = Pick<SettingsRepository, 'getAll' | 'create' | 'update'>;

/** Ajustes que cambian cómo suenan los avisos. */
const PREF_KEYS = ['snoozeMinutes', 'doNotDisturb', 'sound'] as const;

const toPrefs = (settings: Settings) => ({
  snoozeMinutes: normalizeSnooze(settings.snoozeMinutes),
  doNotDisturb: settings.doNotDisturb,
  sound: settings.sound,
});

/**
 * Ajustes del usuario (tabla `settings`). Los cambios se ven al instante (optimista), se guardan en la
 * copia local (se suben al sincronizar) y, si se guardaron, se aplican a los avisos. Si fallan, se revierte.
 */
export function useSettings(injected?: Repository) {
  const local = useLocalRepositories();
  const store = useLocalStore();
  const repository = injected ?? local.settings;
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { applyPrefs } = useTriggerRuntime();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const latestRequest = useRef(0);
  // Último valor guardado: a él se vuelve si un cambio falla.
  const confirmed = useRef<Settings | null>(null);

  const load = useCallback((): Promise<void> => {
    const request = ++latestRequest.current;
    return loadOrCreateSettings(repository).then(
      (row) => {
        if (request !== latestRequest.current) return;
        confirmed.current = row;
        setSettings(row);
        setError(null);
        setLoading(false);
      },
      (cause: unknown) => {
        if (request !== latestRequest.current) return;
        if (__DEV__) console.warn('[settings.load]', cause);
        setError(SETTINGS_LOAD_ERROR);
        setLoading(false);
      },
    );
  }, [repository]);

  useEffect(() => {
    if (userId) void load();
  }, [userId, load]);

  // Ajustes cambiados en otro dispositivo (al sincronizar).
  useEffect(
    () =>
      store.subscribe((change) => {
        if (userId && change.source === 'sync' && change.tablesChanged) void load();
      }),
    [store, userId, load],
  );

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    void load();
  }, [load]);

  const update = useCallback(
    async (changes: UpdateSettingsInput) => {
      if (!userId || !confirmed.current) return;
      setSaveError(null);
      setSettings((current) => (current ? { ...current, ...changes } : current));
      let saved: Settings;
      try {
        saved = await repository.update(userId, changes);
      } catch (cause) {
        if (__DEV__) console.warn('[settings.update]', cause);
        setSettings(confirmed.current);
        setSaveError(SETTINGS_SAVE_ERROR);
        return;
      }
      confirmed.current = saved;
      setSettings(saved);
      // El nombre no cambia los avisos: no hace falta reprogramar.
      if (!PREF_KEYS.some((key) => key in changes)) return;
      // Ya está guardado: si reprogramar falla, se reintenta en el próximo mantenimiento (no se revierte).
      applyPrefs(toPrefs(saved)).catch((cause: unknown) => {
        if (__DEV__) console.warn('[settings.applyPrefs]', cause);
      });
    },
    [userId, repository, applyPrefs],
  );

  return { settings, loading, error, saveError, retry, update };
}
