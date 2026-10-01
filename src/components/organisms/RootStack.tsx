import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/molecules/OfflineBanner';
import { useNetworkStatus } from '@/shared/network/useNetworkStatus';
import { useAppTheme } from '@/shared/theme/useAppTheme';

/** Navegador raíz con el tema aplicado. Al montarse, todo (fuentes y modo de color) ya está listo. */
export function RootStack() {
  const { colors, scheme } = useAppTheme();
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  // Con el aviso visible, la franja ya cubre la barra de estado: las pantallas no deben sumar ese margen otra vez.
  const stackInsets = useMemo(() => (isConnected ? insets : { ...insets, top: 0 }), [isConnected, insets]);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {isConnected ? null : <OfflineBanner />}
      <SafeAreaInsetsContext.Provider value={stackInsets}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </SafeAreaInsetsContext.Provider>
      {/* Sobre la franja (fondo claro) el texto de la barra de estado va oscuro en ambos modos. */}
      <StatusBar style={!isConnected || scheme === 'light' ? 'dark' : 'light'} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
