import { createContext, useContext } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode(mode: ThemeMode): void;
  toggle(): void;
}

// El contexto vive en shared/ para que useAppTheme no dependa de features/;
// el provider (con la persistencia) está en features/theme.
export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode debe usarse dentro de <ThemeModeProvider>.');
  }
  return context;
}
