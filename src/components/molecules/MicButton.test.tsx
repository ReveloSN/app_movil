import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { MicButton } from './MicButton';

jest.setTimeout(20000);
jest.mock('@/shared/haptics/haptics', () => ({ hapticToggleOn: jest.fn(), hapticToggleOff: jest.fn() }));

const STATE = { listening: 'escuchando', stopped: 'detenido' };

async function renderMic(listening: boolean, onPress = jest.fn()) {
  await render(
    <TestProviders>
      <MicButton
        listening={listening}
        onPress={onPress}
        label="Dictar por voz"
        listeningLabel="Dejar de dictar"
        listeningText="Escuchando…"
        stateText={STATE}
      />
    </TestProviders>,
  );
  return onPress;
}

describe('MicButton', () => {
  it('en reposo es un botón accesible "Dictar por voz", detenido y sin texto de estado', async () => {
    await renderMic(false);
    const button = screen.getByRole('button', { name: 'Dictar por voz' });
    expect(button.props.accessibilityValue).toEqual({ text: 'detenido' });
    expect(button.props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.queryByText('Escuchando…')).toBeNull();
  });

  it('al escuchar muestra "Escuchando…" como texto y lo anuncia como estado', async () => {
    await renderMic(true);
    expect(screen.getByText('Escuchando…')).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Dejar de dictar' });
    expect(button.props.accessibilityValue).toEqual({ text: 'escuchando' });
    expect(button.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('el área táctil mide al menos 48 dp', async () => {
    await renderMic(false);
    const style = StyleSheet.flatten(screen.getByRole('button', { name: 'Dictar por voz' }).props.style);
    expect(style.width).toBeGreaterThanOrEqual(48);
    expect(style.height).toBeGreaterThanOrEqual(48);
  });

  it('tocarlo llama a onPress', async () => {
    const onPress = await renderMic(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Dictar por voz' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
