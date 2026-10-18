import { useNavigation } from 'expo-router';
import {
  usePreventRemove,
  type NavigationAction,
  type NavigationProp,
  type ParamListBase,
} from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';

/** Lo mínimo de un navegador para re-despachar una acción. */
interface Navigation {
  dispatch(action: NavigationAction): void;
  getState(): { key: string } | undefined;
  getParent(): Navigation | undefined;
}

/**
 * Re-despacha una acción interceptada en el navegador al que iba dirigida (`target`): desde la pila
 * anidada de la pantalla, una acción del navegador raíz (ej. dismissTo) se perdía.
 */
export function dispatchToOwner(navigation: Navigation, action: NavigationAction): void {
  let owner: Navigation | undefined = navigation;
  while (owner && action.target && owner.getState()?.key !== action.target) owner = owner.getParent();
  (owner ?? navigation).dispatch(action);
}

/**
 * DC-03: con cambios sin guardar, salir de la pantalla (botón de la barra, atrás de Android o una
 * navegación del código) se detiene y pide decidir.
 *
 * Para salir a propósito (tras guardar o eliminar) se usa `leave(navigate)`, y "Descartar" sale como se
 * había pedido. En ambos casos la protección sigue activa y la acción interceptada se re-despacha (React
 * Navigation la deja pasar) en el navegador al que iba (`dispatchToOwner`). No se apaga la protección
 * antes de salir: apagarla cambia el encabezado nativo justo cuando la pantalla se cierra y Android
 * falla con "ScreenStackFragment added into a non-stack container".
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [blocked, setBlocked] = useState<NavigationAction | null>(null);
  // Salida decidida (tras guardar o eliminar): lo que se intercepte a partir de aquí se deja pasar.
  const leaving = useRef(false);

  usePreventRemove(dirty, ({ data }) => {
    if (leaving.current) dispatchToOwner(navigation, data.action);
    else setBlocked(data.action);
  });

  /** Sale sin preguntar (tras guardar o eliminar). */
  const leave = useCallback((navigate: () => void) => {
    leaving.current = true;
    navigate();
  }, []);

  /** "Descartar": sale como se había pedido. */
  const discard = useCallback(() => {
    const action = blocked;
    setBlocked(null);
    if (action) dispatchToOwner(navigation, action);
  }, [blocked, navigation]);

  /** Cierra el diálogo y se queda en la pantalla (también al elegir "Guardar"). */
  const dismiss = useCallback(() => setBlocked(null), []);

  return { confirming: blocked !== null, leave, discard, dismiss };
}
