import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ThemeModeContext, type ThemeMode, type ThemeModeContextValue } from '@/shared/theme/themeMode.context';

const STORAGE_KEY = 'theme-mode';
const DEFAULT_MODE: ThemeMode = 'light';

interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

interface ThemeModeProviderProps {
  children: ReactNode;
  /** Inyectable para tests; por defecto AsyncStorage. */
  storage?: KeyValueStorage;
}

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark';

export function ThemeModeProvider({ children, storage = AsyncStorage }: ThemeModeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    storage
      .getItem(STORAGE_KEY)
      .then((stored) => {
        if (mounted && isThemeMode(stored)) setModeState(stored);
      })
      .catch(() => undefined) // Sin preferencia legible: se queda el modo claro.
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, [storage]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      // Si no se puede guardar, el modo aplica igual durante esta sesión.
      storage.setItem(STORAGE_KEY, next).catch(() => undefined);
    },
    [storage],
  );

  const toggle = useCallback(() => setMode(mode === 'dark' ? 'light' : 'dark'), [mode, setMode]);

  const value = useMemo<ThemeModeContextValue>(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  // No se pinta nada hasta conocer la preferencia: evita un destello claro→oscuro al abrir.
  if (!hydrated) return null;

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}
