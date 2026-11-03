import { fireEvent, render, screen } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { ChecklistDeck } from './ChecklistDeck';
import type { ChecklistItemState } from './checklist.types';

jest.setTimeout(20000);

const item = (id: string, label: string, critical = false): ChecklistItemState => ({
  id,
  label,
  icon: null,
  critical,
  note: null,
  checked: false,
});

async function renderDeck(items: ChecklistItemState[], setItemChecked = jest.fn()) {
  await render(
    <TestProviders>
      <ChecklistDeck items={items} setItemChecked={setItemChecked} />
    </TestProviders>,
  );
  return setItemChecked;
}

describe('ChecklistDeck', () => {
  it('muestra un ítem a la vez, con los botones que hacen lo mismo que deslizar', async () => {
    await renderDeck([item('a', 'Llaves'), item('b', 'Billetera')]);
    expect(screen.getByText('Llaves')).toBeTruthy();
    expect(screen.queryByText('Billetera')).toBeNull();
    expect(screen.getByRole('button', { name: 'Lo llevo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'No lo llevo' })).toBeTruthy();
  });

  it('"Lo llevo" marca el ítem y pasa al siguiente', async () => {
    const setItemChecked = await renderDeck([item('a', 'Llaves'), item('b', 'Billetera')]);
    await fireEvent.press(screen.getByRole('button', { name: 'Lo llevo' }));
    expect(setItemChecked).toHaveBeenCalledWith('a', true);
    expect(await screen.findByText('Billetera')).toBeTruthy();
  });

  it('"No lo llevo" lo deja sin marcar y pasa al siguiente', async () => {
    const setItemChecked = await renderDeck([item('a', 'Llaves'), item('b', 'Billetera')]);
    await fireEvent.press(screen.getByRole('button', { name: 'No lo llevo' }));
    expect(setItemChecked).toHaveBeenCalledWith('a', false);
    expect(await screen.findByText('Billetera')).toBeTruthy();
  });

  it('al responder todo avisa que falta tocar "Listo", y "Deshacer" devuelve la última tarjeta', async () => {
    const setItemChecked = await renderDeck([item('a', 'Llaves')]);
    await fireEvent.press(screen.getByRole('button', { name: 'Lo llevo' }));
    expect(await screen.findByText('Revisaste todo')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Deshacer' }));
    expect(setItemChecked).toHaveBeenLastCalledWith('a', false);
    expect(await screen.findByText('Llaves')).toBeTruthy();
  });
});
