import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardVisible } from './useKeyboardVisible';

/**
 * Alto de la barra de navegación del sistema (3 botones o gestos) que tapa el borde inferior: la app
 * dibuja de borde a borde. Con el teclado abierto es 0, porque el teclado ya cubre esa barra.
 */
export function useBottomInset(): number {
  const { bottom } = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  return keyboardVisible ? 0 : bottom;
}
