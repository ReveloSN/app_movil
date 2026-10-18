import { useNavigation } from 'expo-router';
import {
  usePreventRemove,
  type NavigationAction,
  type NavigationProp,
  type ParamListBase,
} from 'expo-router/react-navigation';
import { useCallback, useEffect, useState } from 'react';

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
 * Para salir a propósito (tras guardar o eliminar) se usa `leave(navigate)`: primero se apaga la
 * protección y, ya en el render siguiente, se navega. No se re-despacha la acción interceptada: una
 * acción como `dismissTo` re-despachada desde una pila anidada (routine/…) no llegaba a ninguna parte y
 * la pantalla se quedaba abierta tras guardar.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [blocked, setBlocked] = useState<NavigationAction | null>(null);
  // Salida decidida: la protección se apaga y, tras ese render, se ejecuta la navegación pendiente.
  const [exit, setExit] = useState<{ navigate: () => void } | null>(null);

  usePreventRemove(dirty && exit === null, ({ data }) => setBlocked(data.action));

  useEffect(() => {
    exit?.navigate();
  }, [exit]);

  /** Sale sin preguntar (tras guardar o eliminar): apaga la protección y luego navega. */
  const leave = useCallback((navigate: () => void) => setExit({ navigate }), []);

  /** "Descartar": sale como se había pedido. */
  const discard = useCallback(() => {
    const action = blocked;
    setBlocked(null);
    if (action) setExit({ navigate: () => dispatchToOwner(navigation, action) });
  }, [blocked, navigation]);

  /** Cierra el diálogo y se queda en la pantalla (también al elegir "Guardar"). */
  const dismiss = useCallback(() => setBlocked(null), []);

  return { confirming: blocked !== null, leave, discard, dismiss };
}
