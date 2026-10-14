import { useCallback, useEffect, useRef, useState } from 'react';

import { appRepositories } from '@/db/app.repositories';
import type { SettingsRepository } from '@/db/repositories/settings.repository';
import { useAuth } from '@/features/auth/AuthProvider';
import { normalizeSnooze } from '@/features/notifications/notification.prefs';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import type { Settings, UpdateSettingsInput } from '@/shared/types/settings.types';

import { SETTINGS_LOAD_ERROR, SETTINGS_SAVE_ERROR } from './settings.copy';
import { loadOrCreateSettings } from './settings.service';

type Repository = Pick<SettingsRepository, 'getAll' | 'create' | 'update'>;

const toPrefs = (settings: Settings) => ({
  snoozeMinutes: normalizeSnooze(settings.snoozeMinutes),
  doNotDisturb: settings.doNotDisturb,
  sound: settings.sound,
});

/**
 * Ajustes del usuario (tabla `settings`). Los cambios se ven al instante (optimista), se guardan en
 * Supabase y, si se guardaron, se aplican a los avisos. Si fallan, se revierte y se muestra el error.
 */
export function useSettings(repository: Repository = appRepositories.settings) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { applyPrefs } = useTriggerRuntime();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const latestRequest = useRef(0);
  // Último valor confirmado por el servidor: a él se vuelve si un cambio falla.
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
      // Ya está guardado: si reprogramar falla, se reintenta en el próximo mantenimiento (no se revierte).
      applyPrefs(toPrefs(saved)).catch((cause: unknown) => {
        if (__DEV__) console.warn('[settings.applyPrefs]', cause);
      });
    },
    [userId, repository, applyPrefs],
  );

  return { settings, loading, error, saveError, retry, update };
}
