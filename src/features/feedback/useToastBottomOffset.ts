import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardVisible } from '@/shared/hooks/useKeyboardVisible';
import { sizes, spacing } from '@/shared/theme/tokens';

/** Distancia del aviso al borde inferior: sobre la barra del sistema y, en las pestañas, sobre la barra de pestañas. */
export function useToastBottomOffset(): number {
  const segments = useSegments();
  const { bottom } = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const onTabs = segments[0] === '(tabs)';
  return (keyboardVisible ? 0 : bottom) + (onTabs ? sizes.tabBarHeight : 0) + spacing.md;
}
