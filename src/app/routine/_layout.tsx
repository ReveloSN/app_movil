import { Stack } from 'expo-router';

import { RequireSession } from '@/features/auth/RequireSession';
import { useAppTheme } from '@/shared/theme/useAppTheme';

// Rutas de rutina apiladas sobre (tabs): al ser hermanas en el Stack raíz, las pestañas quedan ocultas.
export default function RoutineLayout() {
  const { colors, typography } = useAppTheme();

  return (
    <RequireSession>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: typography.h2,
          headerBackTitle: 'Volver',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="new" options={{ title: 'Nueva rutina' }} />
      </Stack>
    </RequireSession>
  );
}
