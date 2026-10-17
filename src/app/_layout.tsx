// Primero: configura NetInfo antes de que nadie se suscriba, y define las tareas en segundo plano
// (Android carga este bundle sin UI para ejecutarlas).
import '@/shared/network/netinfo.config';
import '@/features/notifications/background.tasks';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { RootStack } from '@/components/organisms/RootStack';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { LocalRepositoriesProvider } from '@/features/local-data/LocalRepositoriesProvider';
import { NotificationResponseHandler } from '@/features/notifications/NotificationResponseHandler';
import { TriggerRuntimeProvider } from '@/features/notifications/TriggerRuntimeProvider';
import { TriggerDraftsProvider } from '@/features/triggers/TriggerDraftsProvider';
import { RoutinesProvider } from '@/features/routines/RoutinesProvider';
import { SyncProvider } from '@/features/sync/SyncProvider';
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
        {/* Datos del usuario en el teléfono (local-first): todo lo de abajo lee y escribe ahí. */}
        <LocalRepositoriesProvider>
          <RoutinesProvider>
            <TriggerRuntimeProvider>
              {/* Sube y baja los cambios; rearma los avisos si llega algo nuevo. */}
              <SyncProvider>
                {/* Avisos en edición: los comparten P04, el onboarding y P06 (pantallas distintas del stack). */}
                <TriggerDraftsProvider>
                  <RootStack />
                  <NotificationResponseHandler />
                </TriggerDraftsProvider>
              </SyncProvider>
            </TriggerRuntimeProvider>
          </RoutinesProvider>
        </LocalRepositoriesProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
