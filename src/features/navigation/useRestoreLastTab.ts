import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { loadLastTab, tabPath } from './lastTab.store';

// Una vez por arranque de la app: volver a Inicio después no debe saltar a otra pestaña.
let restored = false;

/**
 * Punto de entrada "ícono de la app" (Documento de Navegación §04): abre en la última pestaña usada.
 * Solo si se entró a Inicio: una notificación que abre P07 (u otra ruta) no se toca.
 */
export function useRestoreLastTab() {
  const pathname = usePathname();
  const latestPath = useRef(pathname);
  useEffect(() => {
    latestPath.current = pathname;
  });

  useEffect(() => {
    if (restored) return;
    restored = true;
    void loadLastTab().then((tab) => {
      if (tab && tab !== 'index' && latestPath.current === '/') router.navigate(tabPath(tab));
    });
  }, []);
}
