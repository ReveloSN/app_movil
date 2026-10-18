import { useSegments } from 'expo-router';
import TopTabs, { type MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { TabScreenHeader } from '@/components/molecules/TabScreenHeader';
import { BottomTabBar } from '@/components/organisms/BottomTabBar';
import { RequireSession } from '@/features/auth/RequireSession';
import { saveLastTab } from '@/features/navigation/lastTab.store';
import { tabConfig, TABS, tabScreenOptions } from '@/features/navigation/tabs.config';
import { TabSwipeLockProvider, useTabSwipeLock } from '@/features/navigation/TabSwipeLock';
import { useRestoreLastTab } from '@/features/navigation/useRestoreLastTab';
import { OnboardingGate } from '@/features/onboarding/OnboardingGate';
import { hapticTick } from '@/shared/haptics/haptics';
import { useKeyboardVisible } from '@/shared/hooks/useKeyboardVisible';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useAppTheme } from '@/shared/theme/useAppTheme';

/** La barra inferior de siempre, conectada al paginador: marca la pestaña actual y cambia al tocar. */
function TabBar({ state, navigation }: MaterialTopTabBarProps) {
  const items = state.routes.map((route: { key: string; name: string }) => {
    const tab = tabConfig(route.name);
    return { key: route.key, label: tab?.title ?? route.name, icon: tab?.icon ?? 'ellipse-outline', activeIcon: tab?.activeIcon ?? 'ellipse' };
  });

  // Háptico ligero al cambiar de pestaña (tocando o deslizando), no al abrir.
  const lastIndex = useRef(state.index);
  useEffect(() => {
    if (lastIndex.current !== state.index) hapticTick();
    lastIndex.current = state.index;
  }, [state.index]);

  function select(index: number) {
    const route = state.routes[index];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (index !== state.index && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  }

  return <BottomTabBar items={items} selectedIndex={state.index} onSelect={select} />;
}

const renderTabBar = (props: MaterialTopTabBarProps) => <TabBar {...props} />;

/** Título del encabezado según la pestaña de la ruta actual. */
function useCurrentTabTitle(): string {
  const segments = useSegments() as string[];
  return tabConfig(segments[1] ?? 'index')?.title ?? TABS[0].title;
}

function TabsNavigator() {
  const { colors } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const keyboardVisible = useKeyboardVisible();
  const { locked } = useTabSwipeLock();
  const title = useCurrentTabTitle();
  // Con el ancho desde el primer cuadro, el paginador monta las pestañas visitadas sin esperar a medirse.
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <TabScreenHeader title={title} />
      <TopTabs
        tabBarPosition="bottom"
        initialLayout={{ width }}
        tabBar={renderTabBar}
        screenListeners={({ route }: { route: { name: string } }) => ({ focus: () => void saveLastTab(route.name) })}
        screenOptions={{
          // Deslizar sigue al dedo (paginador), salvo con el teclado abierto o un gesto horizontal propio.
          ...tabScreenOptions({ keyboardVisible, locked, reducedMotion }),
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {TABS.map((tab) => (
          <TopTabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
        ))}
      </TopTabs>
    </View>
  );
}

export default function TabsLayout() {
  // Abre en la última pestaña usada; la primera vez, OnboardingGate lleva a P01.
  useRestoreLastTab();

  return (
    <RequireSession>
      {/* Primer uso (sin rutinas y sin haber pasado por P01): lleva al onboarding. */}
      <OnboardingGate>
        <TabSwipeLockProvider>
          <TabsNavigator />
        </TabSwipeLockProvider>
      </OnboardingGate>
    </RequireSession>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
