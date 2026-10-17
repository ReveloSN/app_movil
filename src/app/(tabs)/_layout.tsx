import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/atoms/TabBarIcon';
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
          // La pestaña activa: píldora teñida, ícono lleno y verde (no solo color).
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
            tabBarIcon: (props) => <TabBarIcon icon="list-outline" activeIcon="list" {...props} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historial',
            tabBarIcon: (props) => <TabBarIcon icon="time-outline" activeIcon="time" {...props} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ajustes',
            tabBarIcon: (props) => <TabBarIcon icon="settings-outline" activeIcon="settings" {...props} />,
          }}
        />
      </Tabs>
      </OnboardingGate>
    </RequireSession>
  );
}
