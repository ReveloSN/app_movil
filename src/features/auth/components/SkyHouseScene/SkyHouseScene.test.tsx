import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { SCENE_ALT, SkyHouseScene } from './SkyHouseScene';
import { forcedHour } from './useSceneHour';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));

jest.setTimeout(20000);

async function renderScene(date: Date) {
  jest.useFakeTimers({ now: date });
  await render(
    <TestProviders>
      <SkyHouseScene topInset={24} reducedMotion />
    </TestProviders>,
  );
}

describe('SkyHouseScene', () => {
  afterEach(() => jest.useRealTimers());

  it('en modo reducido se dibuja con su texto alternativo, el saludo y el titular de la hora', async () => {
    await renderScene(new Date(2026, 9, 17, 22, 0));

    expect(screen.getByLabelText(SCENE_ALT)).toBeTruthy();
    expect(screen.getByText('Buenas noches')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Cierra el día con calma' })).toBeTruthy();
  });

  it('de día usa el titular de la mañana', async () => {
    await renderScene(new Date(2026, 9, 17, 7, 0));
    expect(screen.getByText('Antes de cruzar la puerta')).toBeTruthy();
  });

  it('mantener presionado activa el recorrido de 24 h y otro mantener-presionado lo quita', async () => {
    await renderScene(new Date(2026, 9, 17, 7, 0));
    const scene = screen.getByLabelText(SCENE_ALT).parent!;

    await fireEvent(scene, 'longPress');
    expect(screen.getByText(/^Demostración · 07:00$/)).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(1000));
    expect(screen.getByText(/^Demostración · 08:00$/)).toBeTruthy();

    await fireEvent(scene, 'longPress');
    expect(screen.queryByText(/Demostración/)).toBeNull();
  });
});

describe('EXPO_PUBLIC_HERO_HOUR', () => {
  it('fuerza la hora solo en desarrollo', () => {
    expect(forcedHour('22', true)).toBe(22);
    expect(forcedHour('22', false)).toBeNull();
    expect(forcedHour(undefined, true)).toBeNull();
    expect(forcedHour('abc', true)).toBeNull();
  });
});
