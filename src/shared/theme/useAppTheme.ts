import { useThemeMode, type ThemeMode } from './themeMode.context';
import { getColors, iconSizes, palettes, radii, sizes, spacing, typography } from './tokens';

export type ThemeColors = Record<keyof typeof palettes.light, string>;

export interface AppTheme {
  scheme: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  sizes: typeof sizes;
  iconSizes: typeof iconSizes;
}

function buildTheme(scheme: ThemeMode): AppTheme {
  return { scheme, colors: getColors(scheme), spacing, radii, typography, sizes, iconSizes };
}

// Objetos estables por modo: el hook no crea un tema nuevo en cada render.
const themes: Record<ThemeMode, AppTheme> = { light: buildTheme('light'), dark: buildTheme('dark') };

/** Tema según el modo elegido por el usuario en Ajustes (no según el sistema operativo). */
export function useAppTheme(): AppTheme {
  return themes[useThemeMode().mode];
}
