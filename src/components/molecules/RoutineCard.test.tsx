import { fireEvent, render, screen } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { RoutineCard } from './RoutineCard';

jest.setTimeout(20000);

describe('RoutineCard', () => {
  it('cada "Verificar ahora" nombra su rutina, así el lector no repite el mismo botón', async () => {
    const openHome = jest.fn();
    const openGym = jest.fn();
    await render(
      <TestProviders>
        <RoutineCard name="Salir de casa" icon={null} active lastCompletedAt={null} actionLabel="Verificar ahora" onAction={openHome} />
        <RoutineCard name="Ir al gimnasio" icon={null} active lastCompletedAt={null} actionLabel="Verificar ahora" onAction={openGym} />
      </TestProviders>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Verificar ahora, Ir al gimnasio' }));
    expect(openGym).toHaveBeenCalledTimes(1);
    expect(openHome).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Verificar ahora, Salir de casa' })).toBeTruthy();
  });
});
