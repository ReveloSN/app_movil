import type { ThemeColors } from '@/shared/theme/useAppTheme';
import type { IoniconName } from '@/shared/utils/ioniconName';

export interface IconOption {
  icon: IoniconName;
  /** Texto alternativo (lector de pantalla). */
  label: string;
}

/** 04-2: conjunto cerrado de íconos de rutina (incluye los de las plantillas). */
export const ROUTINE_ICONS: readonly IconOption[] = [
  { icon: 'checkbox-outline', label: 'Lista' },
  { icon: 'home-outline', label: 'Casa' },
  { icon: 'briefcase-outline', label: 'Trabajo' },
  { icon: 'school-outline', label: 'Estudio' },
  { icon: 'moon-outline', label: 'Noche' },
  { icon: 'airplane-outline', label: 'Viaje' },
  { icon: 'barbell-outline', label: 'Ejercicio' },
  { icon: 'cart-outline', label: 'Compras' },
  { icon: 'paw-outline', label: 'Mascota' },
  { icon: 'car-outline', label: 'Carro' },
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

/** 04-2: colores de categoría del mockup (tokens category*), con su versión para modo oscuro. */
export const ROUTINE_COLORS: readonly ColorOption[] = [
  { key: 'green', label: 'Verde', token: 'categoryGreen', tintToken: 'categoryGreenTint' },
  { key: 'blue', label: 'Azul', token: 'categoryBlue', tintToken: 'categoryBlueTint' },
  { key: 'amber', label: 'Ámbar', token: 'categoryAmber', tintToken: 'categoryAmberTint' },
  { key: 'purple', label: 'Morado', token: 'categoryPurple', tintToken: 'categoryPurpleTint' },
  { key: 'gray', label: 'Gris', token: 'categoryGray', tintToken: 'categoryGrayTint' },
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
