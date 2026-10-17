import type { IoniconName } from '@/shared/utils/ioniconName';

import type { IconOption } from './routine-appearance';

/** 05-2: conjunto cerrado de íconos de ítem, cada uno con su texto alternativo. */
export const ITEM_ICONS: readonly IconOption[] = [
  { icon: 'cube-outline', label: 'Objeto' },
  { icon: 'key-outline', label: 'Llaves' },
  { icon: 'wallet-outline', label: 'Billetera' },
  { icon: 'phone-portrait-outline', label: 'Celular' },
  { icon: 'battery-charging-outline', label: 'Cargador' },
  { icon: 'laptop-outline', label: 'Portátil' },
  { icon: 'card-outline', label: 'Tarjeta o carné' },
  { icon: 'document-text-outline', label: 'Documento' },
  { icon: 'medkit-outline', label: 'Medicamentos' },
  { icon: 'glasses-outline', label: 'Gafas' },
  { icon: 'headset-outline', label: 'Audífonos' },
  { icon: 'umbrella-outline', label: 'Paraguas' },
  { icon: 'water-outline', label: 'Agua' },
  { icon: 'restaurant-outline', label: 'Comida' },
  { icon: 'paw-outline', label: 'Mascota' },
  { icon: 'flame-outline', label: 'Estufa o gas' },
  { icon: 'bulb-outline', label: 'Luces' },
  { icon: 'lock-closed-outline', label: 'Puerta o seguro' },
  { icon: 'alarm-outline', label: 'Alarma' },
  { icon: 'cloud-upload-outline', label: 'Guardar en la nube' },
];

export const DEFAULT_ITEM_ICON: IoniconName = 'cube-outline';

/** Ícono guardado si es del conjunto; si no (o nulo), el genérico. */
export const resolveItemIcon = (icon: string | null | undefined): IconOption =>
  ITEM_ICONS.find((option) => option.icon === icon) ?? ITEM_ICONS[0];
