import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { RadioCardGroup, type RadioCardOption } from './RadioCardGroup';

jest.setTimeout(20000);

type Kind = 'schedule' | 'wifi_exit' | 'wifi_enter';
const OPTIONS: RadioCardOption<Kind>[] = [
  { value: 'schedule', label: 'Horario', icon: 'time-outline' },
  { value: 'wifi_exit', label: 'Salir del Wi-Fi', icon: 'wifi-outline', badgeIcon: 'arrow-forward' },
  { value: 'wifi_enter', label: 'Llegar al Wi-Fi', icon: 'wifi-outline', badgeIcon: 'arrow-back' },
];

async function renderGroup(onChange = jest.fn()) {
  await render(
    <TestProviders>
      <RadioCardGroup accessibilityLabel="Tipo de aviso" options={OPTIONS} value="wifi_exit" onChange={onChange} />
    </TestProviders>,
  );
  return onChange;
}

describe('RadioCardGroup', () => {
  it('es un grupo de selección única con 3 opciones en vertical', async () => {
    await renderGroup();
    // El contenedor no es "accessible" (ocultaría las opciones a TalkBack): se busca por su etiqueta.
    const group = screen.getByLabelText('Tipo de aviso');
    expect(group.props.accessibilityRole).toBe('radiogroup');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    // Vertical: el contenedor no es una fila.
    expect(StyleSheet.flatten(group.props.style).flexDirection ?? 'column').toBe('column');
  });

  it('marca la opción elegida en su estado accesible', async () => {
    await renderGroup();
    expect(screen.getByRole('radio', { name: 'Salir del Wi-Fi' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByRole('radio', { name: 'Horario' }).props.accessibilityState).toMatchObject({ selected: false });
  });

  it('tocar una opción la elige', async () => {
    const onChange = await renderGroup();
    await fireEvent.press(screen.getByRole('radio', { name: 'Llegar al Wi-Fi' }));
    expect(onChange).toHaveBeenCalledWith('wifi_enter');
  });

  it('cada fila mide al menos 56 dp y crece con el texto (minHeight, no alto fijo)', async () => {
    await renderGroup();
    const row = StyleSheet.flatten(screen.getByRole('radio', { name: 'Horario' }).props.style);
    expect(row.minHeight).toBeGreaterThanOrEqual(56);
    expect(row.height).toBeUndefined();
  });
});
