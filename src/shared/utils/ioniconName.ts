import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Convierte un nombre guardado en BD en un ícono válido de Ionicons, o usa `fallback`. */
export function toIoniconName(icon: string | null | undefined, fallback: IoniconName): IoniconName {
  return icon && icon in Ionicons.glyphMap ? (icon as IoniconName) : fallback;
}
