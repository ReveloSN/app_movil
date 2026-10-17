import { useMemo } from 'react';

import { spacing } from '@/shared/theme/tokens';

import { useBottomInset } from './useBottomInset';

/**
 * Margen inferior para el contenido con scroll de pantallas sin pie fijo: el último elemento queda
 * por encima de la barra de navegación del sistema.
 */
export function useScrollEndPadding(): { paddingBottom: number } {
  const bottomInset = useBottomInset();
  return useMemo(() => ({ paddingBottom: spacing.xl + bottomInset }), [bottomInset]);
}
