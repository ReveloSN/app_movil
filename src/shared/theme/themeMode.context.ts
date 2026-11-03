import { createContext, useContext } from 'react';

/** Esquema ya resuelto: lo que realmente se pinta. */
export type ThemeMode = 'light' | 'dark';

/** Lo que elige la persona en Ajustes; `system` sigue al teléfono. */
export type ThemePreference = ThemeMode | 'system';

export interface ThemeModeContextValue {
  /** Esquema resuelto (si la preferencia es `system`, el del teléfono). */
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference(preference: ThemePreference): void;
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
