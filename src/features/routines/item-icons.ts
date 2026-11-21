import type { IoniconName } from '@/shared/utils/ioniconName';

import type { IconOption } from './routine-appearance';
import copy from './routine.copy';

/** Opción de ícono cuyo texto alternativo se lee del idioma activo al pedirlo (no al cargar el módulo). */
const itemIcon = (icon: IoniconName): IconOption => ({
  icon,
  get label() {
    return copy.ITEM_ICON_LABELS[icon];
  },
});

/** 05-2: conjunto cerrado de íconos de ítem, cada uno con su texto alternativo. */
export const ITEM_ICONS: readonly IconOption[] = [
  itemIcon('cube-outline'),
  itemIcon('key-outline'),
  itemIcon('wallet-outline'),
  itemIcon('phone-portrait-outline'),
  itemIcon('battery-charging-outline'),
  itemIcon('laptop-outline'),
  itemIcon('card-outline'),
  itemIcon('document-text-outline'),
  itemIcon('medkit-outline'),
  itemIcon('glasses-outline'),
  itemIcon('headset-outline'),
  itemIcon('umbrella-outline'),
  itemIcon('water-outline'),
  itemIcon('restaurant-outline'),
  itemIcon('paw-outline'),
  itemIcon('flame-outline'),
  itemIcon('bulb-outline'),
  itemIcon('lock-closed-outline'),
  itemIcon('alarm-outline'),
  itemIcon('cloud-upload-outline'),
];

export const DEFAULT_ITEM_ICON: IoniconName = 'cube-outline';

/** Ícono guardado si es del conjunto; si no (o nulo), el genérico. */
export const resolveItemIcon = (icon: string | null | undefined): IconOption =>
  ITEM_ICONS.find((option) => option.icon === icon) ?? ITEM_ICONS[0];
