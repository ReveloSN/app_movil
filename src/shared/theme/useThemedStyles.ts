import { useMemo } from 'react';

import { useAppTheme, type AppTheme } from './useAppTheme';

/**
 * Crea estilos que dependen del tema. `factory` debe definirse fuera del componente
 * (a nivel de módulo) para que los estilos solo se recalculen al cambiar de esquema.
 */
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useAppTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
