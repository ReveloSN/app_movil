import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { useState, type ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import TabsLayout from '../../app/(tabs)/_layout';

// El layout real de (tabs) con pantallas mínimas: sesión y onboarding no son parte de esta prueba.
jest.mock('@/features/auth/RequireSession', () => ({ RequireSession: ({ children }: { children: ReactNode }) => children }));
jest.mock('@/features/onboarding/OnboardingGate', () => ({ OnboardingGate: ({ children }: { children: ReactNode }) => children }));

jest.setTimeout(30000);

/** Pantalla con estado propio: si la pestaña se desmontara al cambiar, el contador volvería a 0. */
function makeTab(label: string) {
  return function Tab() {
    const [count, setCount] = useState(0);
    return (
      <Pressable accessibilityRole="button" onPress={() => setCount((value) => value + 1)}>
        <Text>{`${label} ${count}`}</Text>
      </Pressable>
    );
  };
}

function renderTabs() {
  return renderRouter(
    {
      _layout: () => (
        <TestProviders>
          <Slot />
        </TestProviders>
      ),
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': makeTab('Contenido de Rutinas'),
      '(tabs)/history': makeTab('Contenido de Historial'),
      '(tabs)/settings': makeTab('Contenido de Ajustes'),
    },
    { initialUrl: '/' },
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

describe('pestañas deslizables', () => {
  // Primero: la restauración ocurre una vez por arranque de la app (como en el teléfono).
  it('abre en la última pestaña usada', async () => {
    await AsyncStorage.setItem('last-tab', 'history');
    const result = renderTabs();
    await result;

    await waitFor(() => expect(result.getPathname()).toBe('/history'));
    expect(tab('Historial').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('van en el orden Rutinas, Historial, Ajustes con sus rutas de siempre', async () => {
    await AsyncStorage.removeItem('last-tab');
    const result = renderTabs();
    await result;

    expect(screen.getAllByRole('tab').map((element) => element.props.accessibilityLabel)).toEqual([
      'Rutinas',
      'Historial',
      'Ajustes',
    ]);
    await fireEvent.press(tab('Ajustes'));
    expect(result.getPathname()).toBe('/settings');
    await fireEvent.press(tab('Historial'));
    expect(result.getPathname()).toBe('/history');
  });

  it('la barra marca la pestaña activa, el encabezado la nombra y se guarda como última usada', async () => {
    const result = renderTabs();
    await result;

    await fireEvent.press(tab('Ajustes'));

    expect(tab('Ajustes').props.accessibilityState).toMatchObject({ selected: true });
    expect(tab('Rutinas').props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByRole('header', { name: 'Ajustes' })).toBeTruthy();
    await waitFor(async () => expect(await AsyncStorage.getItem('last-tab')).toBe('settings'));
    expect(result.getPathname()).toBe('/settings');
  });

  it('cada pestaña conserva su contenido al ir y volver', async () => {
    await AsyncStorage.removeItem('last-tab');
    const result = renderTabs();
    await result;
    await fireEvent.press(tab('Rutinas'));

    await fireEvent.press(screen.getByText('Contenido de Rutinas 0'));
    await fireEvent.press(tab('Historial'));
    await act(async () => undefined);
    await fireEvent.press(tab('Rutinas'));

    expect(screen.getByText('Contenido de Rutinas 1')).toBeTruthy();
  });
});
