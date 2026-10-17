import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { useToast } from './toast.context';
import { TOAST_DURATION_MS, TOAST_WITH_ACTION_DURATION_MS } from './toast.timing';
import type { ToastContextValue } from './toast.types';
import { ToastProvider } from './ToastProvider';

jest.mock('expo-router', () => ({ useSegments: () => ['(tabs)'] }));

const captured: { current: ToastContextValue | null } = { current: null };
function Capture() {
  const value = useToast();
  useEffect(() => {
    captured.current = value;
  }, [value]);
  return <Text>Inicio</Text>;
}
const toast = { show: (...args: Parameters<ToastContextValue['show']>) => captured.current?.show(...args) };

async function setup() {
  await render(
    <TestProviders insets={{ bottom: 48 }}>
      <ToastProvider>
        <Capture />
      </ToastProvider>
    </TestProviders>,
  );
}

// El primer render de un componente compila mucho en frío: con toda la suite en paralelo supera los 5 s.
jest.setTimeout(20000);

describe('ToastProvider', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('muestra el aviso, lo anuncia con una región viva y se oculta solo', async () => {
    await setup();
    await act(async () => toast.show('Rutina guardada.'));

    const message = screen.getByText('Rutina guardada.');
    expect(screen.getByTestId('toast').props.accessibilityLiveRegion).toBe('polite');
    expect(message).toBeTruthy();

    await act(async () => jest.advanceTimersByTime(TOAST_DURATION_MS + 500));
    expect(screen.queryByText('Rutina guardada.')).toBeNull();
  });

  it('un aviso nuevo reemplaza al anterior', async () => {
    await setup();
    await act(async () => toast.show('Rutina guardada.'));
    await act(async () => toast.show({ message: 'Cambios guardados.' }));

    expect(screen.queryByText('Rutina guardada.')).toBeNull();
    expect(screen.getByText('Cambios guardados.')).toBeTruthy();
  });

  it('la acción opcional se ejecuta y cierra el aviso', async () => {
    const undo = jest.fn();
    await setup();
    await act(async () => toast.show({ message: 'Ítem quitado.', action: { label: 'Deshacer', onPress: undo } }));

    await fireEvent.press(screen.getByRole('button', { name: 'Deshacer' }));
    await act(async () => jest.advanceTimersByTime(500));

    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Ítem quitado.')).toBeNull();
  });

  it('con acción espera más antes de ocultarse', async () => {
    await setup();
    await act(async () => toast.show({ message: 'Ítem quitado.', action: { label: 'Deshacer', onPress: jest.fn() } }));

    await act(async () => jest.advanceTimersByTime(TOAST_DURATION_MS + 500));
    expect(screen.getByText('Ítem quitado.')).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(TOAST_WITH_ACTION_DURATION_MS));
    expect(screen.queryByText('Ítem quitado.')).toBeNull();
  });
});
