import type { ReactNode } from 'react';
import { SafeAreaProvider, type EdgeInsets } from 'react-native-safe-area-context';

import { ThemeModeContext, type ThemeMode } from '@/shared/theme/themeMode.context';

interface TestProvidersProps {
  children: ReactNode;
  /** Insets simulados (ej. barra de 3 botones = 48 abajo). */
  insets?: Partial<EdgeInsets>;
  mode?: ThemeMode;
}

const NO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const noop = () => undefined;

/** Tema y zona segura para probar componentes sin montar la app entera. */
export function TestProviders({ children, insets, mode = 'light' }: TestProvidersProps) {
  return (
    <SafeAreaProvider
      initialMetrics={{ insets: { ...NO_INSETS, ...insets }, frame: { x: 0, y: 0, width: 360, height: 640 } }}
    >
      <ThemeModeContext.Provider value={{ mode, setMode: noop, toggle: noop }}>{children}</ThemeModeContext.Provider>
    </SafeAreaProvider>
  );
}
