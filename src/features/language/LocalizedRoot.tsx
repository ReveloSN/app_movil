import { Fragment, type ReactNode } from 'react';

import { useLocale } from '@/shared/i18n/useLocale';

/**
 * Al cambiar de idioma se vuelve a montar la interfaz para que cada pantalla lea sus textos de nuevo.
 * Los proveedores de datos (sesión, copia local, sincronización) quedan fuera y no se reinician.
 */
export function LocalizedRoot({ children }: { children: ReactNode }) {
  const locale = useLocale();
  return <Fragment key={locale}>{children}</Fragment>;
}
