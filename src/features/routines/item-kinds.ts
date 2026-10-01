import type { SegmentOption } from '@/components/molecules/SegmentedControl';

import type { ItemKind } from './routines.types';

export const DEFAULT_ITEM_KIND: ItemKind = 'carry';

export const ITEM_KIND_OPTIONS: readonly SegmentOption<ItemKind>[] = [
  { value: 'carry', label: 'Llevar' },
  { value: 'do', label: 'Hacer' },
  { value: 'check', label: 'Comprobar' },
];
