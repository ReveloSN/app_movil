import type { ThemeColors } from '@/shared/theme/useAppTheme';
import type { IoniconName } from '@/shared/utils/ioniconName';

import copy from './routine.copy';

export interface IconOption {
  icon: IoniconName;
  /** Texto alternativo (lector de pantalla). */
  label: string;
}

/** Opción de ícono cuyo texto alternativo se lee del idioma activo al pedirlo (no al cargar el módulo). */
const routineIcon = (icon: IoniconName): IconOption => ({
  icon,
  get label() {
    return copy.ROUTINE_ICON_LABELS[icon];
  },
});

/** 04-2: conjunto cerrado de íconos de rutina (incluye los de las plantillas). */
export const ROUTINE_ICONS: readonly IconOption[] = [
  routineIcon('checkbox-outline'),
  routineIcon('home-outline'),
  routineIcon('briefcase-outline'),
  routineIcon('school-outline'),
  routineIcon('moon-outline'),
  routineIcon('airplane-outline'),
  routineIcon('barbell-outline'),
  routineIcon('cart-outline'),
  routineIcon('paw-outline'),
  routineIcon('car-outline'),
];

export type RoutineColorKey = 'green' | 'blue' | 'amber' | 'purple' | 'gray';

export interface ColorOption {
  key: RoutineColorKey;
  label: string;
  /** Token del tema: el mismo color se adapta al modo oscuro. */
  token: keyof ThemeColors;
  /** Tinte suave del mismo color (fondo del ícono, franjas). */
  tintToken: keyof ThemeColors;
}

/** Opción de color cuyo nombre se lee del idioma activo al pedirlo (no al cargar el módulo). */
const routineColor = (key: RoutineColorKey, token: keyof ThemeColors, tintToken: keyof ThemeColors): ColorOption => ({
  key,
  get label() {
    return copy.ROUTINE_COLOR_LABELS[key];
  },
  token,
  tintToken,
});

/** 04-2: colores de categoría del mockup (tokens category*), con su versión para modo oscuro. */
export const ROUTINE_COLORS: readonly ColorOption[] = [
  routineColor('green', 'categoryGreen', 'categoryGreenTint'),
  routineColor('blue', 'categoryBlue', 'categoryBlueTint'),
  routineColor('amber', 'categoryAmber', 'categoryAmberTint'),
  routineColor('purple', 'categoryPurple', 'categoryPurpleTint'),
  routineColor('gray', 'categoryGray', 'categoryGrayTint'),
];

/** El ícono es obligatorio (modelo de contenido): si no se elige, este. */
export const DEFAULT_ROUTINE_ICON: IoniconName = 'checkbox-outline';
export const DEFAULT_ROUTINE_COLOR: RoutineColorKey = 'green';

/** Ícono guardado si es del conjunto; si no (o nulo), el de por defecto. */
export const resolveRoutineIcon = (icon: string | null | undefined): IoniconName =>
  ROUTINE_ICONS.find((option) => option.icon === icon)?.icon ?? DEFAULT_ROUTINE_ICON;

/** Color guardado si es del conjunto; si no (o nulo), el de por defecto. */
export const resolveRoutineColor = (color: string | null | undefined): ColorOption =>
  ROUTINE_COLORS.find((option) => option.key === color) ?? ROUTINE_COLORS[0];

export interface RoutineAccent {
  /** Color de la rutina (ícono, franja). Nunca la única señal: siempre va con ícono y nombre. */
  color: string;
  tint: string;
}

/** Color de la rutina y su tinte, ya resueltos al tema (claro u oscuro). */
export const routineAccent = (colors: ThemeColors, color: string | null | undefined): RoutineAccent => {
  const option = resolveRoutineColor(color);
  return { color: colors[option.token], tint: colors[option.tintToken] };
};
