import { Stack } from 'expo-router';

import { RequireSession } from '@/features/auth/RequireSession';
import { PERMISSIONS_TITLE } from '@/features/permissions/permission.copy';
import { EDIT_ROUTINE_TITLE, NEW_ROUTINE_TITLE } from '@/features/routines/routine.copy';
import { CONFIGURE_TRIGGER_TITLE } from '@/features/triggers/trigger.copy';
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
        {/* P04: crear y editar comparten formulario (RoutineForm). */}
        <Stack.Screen name="new" options={{ title: NEW_ROUTINE_TITLE }} />
        <Stack.Screen name="[id]/edit" options={{ title: EDIT_ROUTINE_TITLE }} />
        <Stack.Screen name="templates" options={{ title: 'Plantillas' }} />
        <Stack.Screen name="trigger" options={{ title: CONFIGURE_TRIGGER_TITLE }} />
        <Stack.Screen name="permissions" options={{ title: PERMISSIONS_TITLE }} />
        {/* P07 y P08 dibujan su propio encabezado (nombre en h1 + cerrar) para dejarle más alto a la lista. */}
        <Stack.Screen name="[id]/verify" options={{ headerShown: false }} />
        <Stack.Screen name="[id]/summary" options={{ headerShown: false }} />
      </Stack>
    </RequireSession>
  );
}
