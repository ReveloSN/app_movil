import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { TestProviders } from '@/shared/testing/TestProviders';

import { AddRoutineMenu } from './AddRoutineMenu';

jest.setTimeout(20000);

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/shared/network/useNetworkStatus', () => ({ useNetworkStatus: () => ({ isConnected: true }) }));

async function openMenu() {
  await render(
    <TestProviders>
      <AddRoutineMenu />
    </TestProviders>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Agregar rutina' }));
}

describe('AddRoutineMenu', () => {
  it('es un solo botón "+" y las formas de crear salen de él', async () => {
    await render(
      <TestProviders>
        <AddRoutineMenu />
      </TestProviders>,
    );
    expect(screen.getByRole('button', { name: 'Agregar rutina' })).toBeTruthy();
    expect(screen.queryByText('Ver plantillas')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Agregar rutina' }));
    expect(await screen.findByText('Crear rutina')).toBeTruthy();
    expect(screen.getByText('Ver plantillas')).toBeTruthy();
  });

  it('"Crear rutina" abre el formulario y "Ver plantillas" abre las plantillas', async () => {
    await openMenu();
    await fireEvent.press(await screen.findByRole('button', { name: 'Crear rutina' }));
    expect(router.push).toHaveBeenCalledWith('/routine/new');

    await fireEvent.press(screen.getByRole('button', { name: 'Agregar rutina' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ver plantillas' }));
    expect(router.push).toHaveBeenCalledWith('/routine/templates');
  });
});
