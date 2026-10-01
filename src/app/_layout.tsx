import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { RootStack } from '@/components/organisms/RootStack';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { RoutinesProvider } from '@/features/routines/RoutinesProvider';
import { ThemeModeProvider } from '@/features/theme/ThemeModeProvider';
import { fontAssets } from '@/shared/theme/fonts';

// La splash se mantiene hasta que RootStack se monta (fuentes y modo de color cargados).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeModeProvider>
      <AuthProvider>
        <RoutinesProvider>
          <RootStack />
        </RoutinesProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
