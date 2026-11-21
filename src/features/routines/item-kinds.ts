import type { SegmentOption } from '@/components/molecules/SegmentedControl';

import copy from './routine.copy';
import type { ItemKind } from './routines.types';

export const DEFAULT_ITEM_KIND: ItemKind = 'carry';

/** Opción de tipo de ítem cuyo nombre se lee del idioma activo al pedirlo (no al cargar el módulo). */
const kindOption = (value: ItemKind): SegmentOption<ItemKind> => ({
  value,
  get label() {
    return copy.ITEM_KIND_NAMES[value];
  },
});

export const ITEM_KIND_OPTIONS: readonly SegmentOption<ItemKind>[] = [
  kindOption('carry'),
  kindOption('do'),
  kindOption('check'),
];

export const isItemKind = (value: string | null): value is ItemKind =>
  ITEM_KIND_OPTIONS.some((option) => option.value === value);
