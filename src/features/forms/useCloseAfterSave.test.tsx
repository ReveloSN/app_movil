import { router, Stack, Tabs } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { ToastProvider } from '@/features/feedback/ToastProvider';
import { TestProviders } from '@/shared/testing/TestProviders';

import { useCloseAfterSave, type SaveDestination } from './useCloseAfterSave';

// Se espía la protección para comprobar que no se apaga al salir (ver la prueba de regresión).
jest.mock('expo-router/react-navigation', () => {
  const actual = jest.requireActual('expo-router/react-navigation');
  return { ...actual, usePreventRemove: jest.fn(actual.usePreventRemove) };
});

jest.setTimeout(30000);

/** Pantalla con cambios sin guardar (DC-03 activo), como P04 o P06 tras escribir algo. */
function makeEditor(destination: SaveDestination, message: string) {
  return function Editor() {
    const guard = useCloseAfterSave(true, destination);
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => guard.close(message)}>
          <Text>Guardar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/(tabs)')}>
          <Text>Salir</Text>
        </Pressable>
        {guard.confirming ? (
          <Pressable accessibilityRole="button" onPress={guard.discard}>
            <Text>Descartar</Text>
          </Pressable>
        ) : null}
      </>
    );
  };
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <TestProviders>
      <ToastProvider>{children}</ToastProvider>
    </TestProviders>
  );
}

function renderApp(initialUrl = '/') {
  return renderRouter(
    {
      _layout: () => (
        <Providers>
          <Stack screenOptions={{ headerShown: false }} />
        </Providers>
      ),
      '(tabs)/_layout': () => <Tabs />,
      '(tabs)/index': () => <Text>Inicio</Text>,
      'routine/_layout': () => <Stack />,
      'routine/new': makeEditor('home', 'Rutina guardada.'),
      'routine/trigger': makeEditor('back', 'Te avisaremos cuando salgas de Casa.'),
    },
    { initialUrl },
  );
}

describe('useCloseAfterSave', () => {
  it('P06 (back): guardar vuelve a la pantalla anterior con su aviso', async () => {
    const result = renderApp();
    await result;
    await act(async () => {
      router.push('/routine/new');
      router.push('/routine/trigger');
    });

    await fireEvent.press(screen.getAllByText('Guardar').at(-1)!);

    expect(result.getPathname()).toBe('/routine/new');
    expect(await screen.findByText('Te avisaremos cuando salgas de Casa.')).toBeTruthy();
  });

  it('sin historial (entrada directa) vuelve a Inicio con replace', async () => {
    const result = renderApp('/routine/new');
    await result;

    await fireEvent.press(screen.getByText('Guardar'));

    expect(result.getPathname()).toBe('/');
  });

  it('DC-03 «Descartar» sale como se había pedido, también con dismissTo desde la pila anidada', async () => {
    const result = renderApp();
    await result;
    await act(async () => router.push('/routine/new'));

    await fireEvent.press(screen.getByText('Salir'));
    expect(result.getPathname()).toBe('/routine/new');
    await fireEvent.press(screen.getByText('Descartar'));

    expect(result.getPathname()).toBe('/');
  });

  it('al salir no apaga la protección (apagarla cambia el encabezado nativo y Android falla al cerrar)', async () => {
    const result = renderApp();
    await result;
    await act(async () => {
      router.push('/routine/new');
      router.push('/routine/trigger');
    });
    const prevented = usePreventRemove as jest.Mock;
    prevented.mockClear();

    await fireEvent.press(screen.getAllByText('Guardar').at(-1)!);

    expect(result.getPathname()).toBe('/routine/new');
    expect(prevented.mock.calls.every(([enabled]) => enabled === true)).toBe(true);
  });
});
