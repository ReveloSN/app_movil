import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { ReorderableItemList } from './ReorderableItemList';

jest.setTimeout(20000);

const items = [
  { key: 'a', label: 'Llaves', critical: true },
  { key: 'b', label: 'Cartera', critical: false },
  { key: 'c', label: 'Celular', critical: false },
];

async function renderList(list = items, onMove = jest.fn()) {
  await render(
    <TestProviders>
      <ReorderableItemList
        items={list}
        gap={16}
        onMove={onMove}
        renderRow={(item, _index, handle) => (
          <>
            {handle}
            <Text>{item.label}</Text>
          </>
        )}
      />
    </TestProviders>,
  );
  return onMove;
}

describe('ReorderableItemList', () => {
  it('cada fila tiene un asa con acciones Subir/Bajar solo hacia donde se puede mover', async () => {
    await renderList();
    // «Llaves» es crítico y está solo en su grupo: no tiene a dónde ir.
    expect(screen.getByLabelText('Reordenar «Llaves»').props.accessibilityActions).toEqual([]);
    expect(screen.getByLabelText('Reordenar «Cartera»').props.accessibilityActions).toEqual([
      { name: 'moveDown', label: 'Bajar' },
    ]);
    expect(screen.getByLabelText('Reordenar «Celular»').props.accessibilityActions).toEqual([
      { name: 'moveUp', label: 'Subir' },
    ]);
  });

  it('las acciones de accesibilidad mueven el ítem una posición', async () => {
    const onMove = await renderList();
    await fireEvent(screen.getByLabelText('Reordenar «Cartera»'), 'accessibilityAction', {
      nativeEvent: { actionName: 'moveDown' },
    });
    expect(onMove).toHaveBeenCalledWith('b', 2);
  });

  it('tocar el asa muestra los botones Subir y Bajar, que mueven y respetan los bordes', async () => {
    const onMove = await renderList();
    await fireEvent.press(screen.getByLabelText('Reordenar «Celular»'));
    const up = screen.getByRole('button', { name: 'Subir «Celular»' });
    const down = screen.getByRole('button', { name: 'Bajar «Celular»' });
    expect(down.props.accessibilityState).toEqual({ disabled: true });
    await fireEvent.press(up);
    expect(onMove).toHaveBeenCalledWith('c', 1);
  });

  it('con un solo ítem no hay asa', async () => {
    await renderList([items[0]]);
    expect(screen.queryByLabelText('Reordenar «Llaves»')).toBeNull();
  });
});
