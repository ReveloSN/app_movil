import { useThemeMode, type ThemeMode, type ThemePreference } from './themeMode.context';
import { getColors, iconSizes, palettes, radii, sizes, spacing, typography } from './tokens';

export type ThemeColors = Record<keyof typeof palettes.light, string>;

export interface AppTheme {
  /** Esquema resuelto que se pinta. */
  scheme: ThemeMode;
  /** Lo elegido en Ajustes (puede ser `system`). */
  preference: ThemePreference;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  sizes: typeof sizes;
  iconSizes: typeof iconSizes;
}

function buildTheme(scheme: ThemeMode, preference: ThemePreference): AppTheme {
  return { scheme, preference, colors: getColors(scheme), spacing, radii, typography, sizes, iconSizes };
}

// Objetos estables por combinación: el hook no crea un tema nuevo en cada render.
const preferences: ThemePreference[] = ['light', 'dark', 'system'];
const build = (scheme: ThemeMode) =>
  Object.fromEntries(preferences.map((p) => [p, buildTheme(scheme, p)])) as Record<ThemePreference, AppTheme>;
const themes: Record<ThemeMode, Record<ThemePreference, AppTheme>> = { light: build('light'), dark: build('dark') };

/** Tema según la preferencia de Ajustes; con `system`, el esquema del teléfono. */
export function useAppTheme(): AppTheme {
  const { mode, preference } = useThemeMode();
  return themes[mode][preference];
}
