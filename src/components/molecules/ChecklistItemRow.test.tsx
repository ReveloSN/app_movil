import { fireEvent, render, screen } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { ChecklistItemRow } from './ChecklistItemRow';

jest.setTimeout(20000);

async function renderRow(checked: boolean, onToggle = jest.fn()) {
  await render(
    <TestProviders>
      <ChecklistItemRow label="Llaves" icon="key-outline" critical criticalLabel="crítico" checked={checked} onToggle={onToggle} />
    </TestProviders>,
  );
  return onToggle;
}

describe('ChecklistItemRow', () => {
  it('es una casilla con su estado y su marca de crítico para el lector de pantalla', async () => {
    await renderRow(true);
    const row = screen.getByRole('checkbox', { name: 'Llaves, crítico' });
    expect(row.props.accessibilityState).toEqual({ checked: true });
  });

  it('marcar responde al instante (la animación no retrasa el toque)', async () => {
    const onToggle = await renderRow(false);
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Llaves, crítico' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('ofrece "Marcar" como acción de accesibilidad y la ejecuta (el deslizar no es la única vía)', async () => {
    const onToggle = await renderRow(false);
    const row = screen.getByRole('checkbox', { name: 'Llaves, crítico' });
    expect(row.props.accessibilityActions).toEqual([{ name: 'toggle', label: 'Marcar' }]);
    await fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'toggle' } });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('ofrece "Desmarcar" cuando ya está marcada', async () => {
    await renderRow(true);
    const row = screen.getByRole('checkbox', { name: 'Llaves, crítico' });
    expect(row.props.accessibilityActions).toEqual([{ name: 'toggle', label: 'Desmarcar' }]);
  });
});
