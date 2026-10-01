import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';

import { LoadingState } from '@/components/molecules/LoadingState';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/shared/theme/tokens';

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.tabInactive }}>
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
  );
}
