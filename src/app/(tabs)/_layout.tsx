import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { RequireSession } from '@/features/auth/RequireSession';
import { saveLastTab } from '@/features/navigation/lastTab.store';
import { useRestoreLastTab } from '@/features/navigation/useRestoreLastTab';
import { OnboardingGate } from '@/features/onboarding/OnboardingGate';
import { useAppTheme } from '@/shared/theme/useAppTheme';

export default function TabsLayout() {
  const { colors, typography } = useAppTheme();
  // Abre en la última pestaña usada; la primera vez, OnboardingGate lleva a P01.
  useRestoreLastTab();

  return (
    <RequireSession>
      {/* Primer uso (sin rutinas y sin haber pasado por P01): lleva al onboarding. */}
      <OnboardingGate>
      <Tabs
        screenListeners={({ route }) => ({ focus: () => void saveLastTab(route.name) })}
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
          tabBarLabelStyle: typography.caption,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: typography.h2,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Rutinas',
            tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historial',
            tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
      </OnboardingGate>
    </RequireSession>
  );
}
