import { Stack } from 'expo-router';

import { RequireSession } from '@/features/auth/RequireSession';
import { PERMISSIONS_TITLE } from '@/features/permissions/permission.copy';
import { EDIT_ROUTINE_TITLE, NEW_ROUTINE_TITLE } from '@/features/routines/routine.copy';
import { CREATE_TITLE as CREATE_WITH_AI_TITLE } from '@/features/ai/ai.copy';
import { renderCancelHeader } from '@/features/routines/routineFormHeader';
import { IMPORT_TITLE } from '@/features/routines/share/share.copy';
import { CONFIGURE_TRIGGER_TITLE } from '@/features/triggers/trigger.copy';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useAppTheme } from '@/shared/theme/useAppTheme';

// Rutas de rutina apiladas sobre (tabs): al ser hermanas en el Stack raíz, las pestañas quedan ocultas.
export default function RoutineLayout() {
  const { colors, typography } = useAppTheme();
  // Con "Quitar animaciones" no hay transición entre pantallas (los modales tampoco suben).
  const reduceMotion = useReducedMotion();
  const modalAnimation = reduceMotion ? 'none' : 'slide_from_bottom';

  return (
    <RequireSession>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: typography.h2,
          headerBackTitle: 'Volver',
          contentStyle: { backgroundColor: colors.background },
          animation: reduceMotion ? 'none' : 'slide_from_right',
        }}
      >
        {/* P04: crear y editar comparten formulario (RoutineForm). */}
        <Stack.Screen name="new" options={{ title: NEW_ROUTINE_TITLE, headerLeft: renderCancelHeader }} />
        <Stack.Screen name="[id]/edit" options={{ title: EDIT_ROUTINE_TITLE, headerLeft: renderCancelHeader }} />
        <Stack.Screen name="templates" options={{ title: 'Plantillas' }} />
        <Stack.Screen name="ai" options={{ title: CREATE_WITH_AI_TITLE }} />
        <Stack.Screen name="import" options={{ title: IMPORT_TITLE }} />
        <Stack.Screen name="trigger" options={{ title: CONFIGURE_TRIGGER_TITLE }} />
        <Stack.Screen name="permissions" options={{ title: PERMISSIONS_TITLE }} />
        {/* P07 y P08 dibujan su propio encabezado (nombre en h1 + cerrar) para dejarle más alto a la lista.
            P07 es un modal que sube desde abajo; P08 aparece dentro de él con un fundido. */}
        <Stack.Screen
          name="[id]/verify"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: modalAnimation }}
        />
        {/* Modo salida: la misma verificación en pantalla completa, con ítems grandes. */}
        <Stack.Screen
          name="[id]/go"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: modalAnimation }}
        />
        <Stack.Screen name="[id]/summary" options={{ headerShown: false, animation: reduceMotion ? 'none' : 'fade' }} />
      </Stack>
    </RequireSession>
  );
}
