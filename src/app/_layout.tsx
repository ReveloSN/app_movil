// Primero: configura NetInfo antes de que nadie se suscriba, y define las tareas en segundo plano
// (Android carga este bundle sin UI para ejecutarlas).
import '@/shared/network/netinfo.config';
import '@/features/notifications/background.tasks';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { RootStack } from '@/components/organisms/RootStack';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ChecklistSyncProvider } from '@/features/checklist/ChecklistSyncProvider';
import { NotificationResponseHandler } from '@/features/notifications/NotificationResponseHandler';
import { TriggerRuntimeProvider } from '@/features/notifications/TriggerRuntimeProvider';
import { TriggerDraftsProvider } from '@/features/triggers/TriggerDraftsProvider';
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
          <ChecklistSyncProvider>
            <TriggerRuntimeProvider>
              {/* Avisos en edición: los comparten P04, el onboarding y P06 (pantallas distintas del stack). */}
              <TriggerDraftsProvider>
                <RootStack />
                <NotificationResponseHandler />
              </TriggerDraftsProvider>
            </TriggerRuntimeProvider>
          </ChecklistSyncProvider>
        </RoutinesProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
