import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  ThemeModeContext,
  type ThemeMode,
  type ThemeModeContextValue,
  type ThemePreference,
} from '@/shared/theme/themeMode.context';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

const STORAGE_KEY = 'theme-mode';
// Sin valor guardado se sigue al teléfono; un 'light'/'dark' guardado antes se respeta.
const DEFAULT_PREFERENCE: ThemePreference = 'system';

interface ThemeModeProviderProps {
  children: ReactNode;
  /** Inyectable para tests; por defecto AsyncStorage. */
  storage?: KeyValueStorage;
}

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

export function ThemeModeProvider({ children, storage = AsyncStorage }: ThemeModeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [hydrated, setHydrated] = useState(false);
  // Se vuelve a renderizar cuando el teléfono cambia de esquema.
  const systemScheme = useColorScheme();

  useEffect(() => {
    let mounted = true;
    storage
      .getItem(STORAGE_KEY)
      .then((stored) => {
        if (mounted && isThemePreference(stored)) setPreferenceState(stored);
      })
      .catch(() => undefined) // Sin preferencia legible: se sigue al sistema.
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, [storage]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      // Si no se puede guardar, la preferencia aplica igual durante esta sesión.
      storage.setItem(STORAGE_KEY, next).catch(() => undefined);
    },
    [storage],
  );

  const mode: ThemeMode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeModeContextValue>(
    () => ({ mode, preference, setPreference }),
    [mode, preference, setPreference],
  );

  // No se pinta nada hasta conocer la preferencia: evita un destello al abrir.
  if (!hydrated) return null;

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}
