import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { BigChecklistItem } from './BigChecklistItem';

jest.setTimeout(20000);

async function renderItem(props: { checked: boolean; critical?: boolean }, onToggle = jest.fn()) {
  await render(
    <TestProviders>
      <BigChecklistItem label="Llaves" icon="key-outline" criticalLabel="Crítico" critical={props.critical ?? false} checked={props.checked} onToggle={onToggle} />
    </TestProviders>,
  );
  return onToggle;
}

describe('BigChecklistItem', () => {
  it('es una casilla con su estado', async () => {
    await renderItem({ checked: true });
    expect(screen.getByRole('checkbox', { name: 'Llaves' }).props.accessibilityState).toEqual({ checked: true });
  });

  it('toda la fila marca y mide al menos 64 dp con texto de 20 sp', async () => {
    const onToggle = await renderItem({ checked: false });
    const row = screen.getByRole('checkbox', { name: 'Llaves' });
    await fireEvent.press(row);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(StyleSheet.flatten(row.props.style).minHeight).toBeGreaterThanOrEqual(64);
    expect(StyleSheet.flatten(screen.getByText('Llaves').props.style).fontSize).toBeGreaterThanOrEqual(20);
  });

  it('el crítico se dice y se escribe, no depende del color', async () => {
    await renderItem({ checked: false, critical: true });
    expect(screen.getByRole('checkbox', { name: 'Llaves, Crítico' })).toBeTruthy();
    expect(screen.getByText('Crítico')).toBeTruthy();
  });
});
