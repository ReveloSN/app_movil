import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';

/**
 * DC-03: con cambios sin guardar, salir de la pantalla (botón de la barra, atrás de Android o una
 * navegación del código) se detiene y pide decidir. Tras guardar o eliminar, `allowExit` deja salir
 * sin volver a preguntar.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const navigation = useNavigation();
  const [blocked, setBlocked] = useState<NavigationAction | null>(null);
  // true cuando la salida ya está decidida: la navegación que sigue no se intercepta.
  const allowed = useRef(false);

  usePreventRemove(dirty, ({ data }) => {
    if (allowed.current) navigation.dispatch(data.action);
    else setBlocked(data.action);
  });

  const allowExit = useCallback(() => {
    allowed.current = true;
  }, []);

  /** "Descartar": sale como se había pedido. */
  const discard = useCallback(() => {
    allowed.current = true;
    setBlocked(null);
    if (blocked) navigation.dispatch(blocked);
  }, [blocked, navigation]);

  /** Cierra el diálogo y se queda en la pantalla (también al elegir "Guardar"). */
  const dismiss = useCallback(() => setBlocked(null), []);

  return { confirming: blocked !== null, allowExit, discard, dismiss };
}
