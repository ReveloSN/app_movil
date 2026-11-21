import { useSyncExternalStore } from 'react';

import { getLocale, subscribeLocale } from './locale.store';
import type { Locale } from './locale.types';

/** Idioma activo; el componente se redibuja cuando cambia. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}
