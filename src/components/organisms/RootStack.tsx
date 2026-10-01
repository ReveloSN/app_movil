import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useAppTheme } from '@/shared/theme/useAppTheme';

/** Navegador raíz con el tema aplicado. Al montarse, todo (fuentes y modo de color) ya está listo. */
export function RootStack() {
  const { colors, scheme } = useAppTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
