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

  it('tocar el cuerpo verifica y editar es un botón aparte con el nombre de la rutina', async () => {
    const verify = jest.fn();
    const edit = jest.fn();
    await render(
      <TestProviders>
        <RoutineCard
          name="Salir de casa"
          icon={null}
          active
          lastCompletedAt={null}
          onPress={verify}
          pressHint="Abre la verificación"
          onEdit={edit}
          editLabel="Editar Salir de casa"
        />
      </TestProviders>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Salir de casa. Aún no la has completado.' }));
    expect(verify).toHaveBeenCalledTimes(1);
    expect(edit).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Editar Salir de casa' }));
    expect(edit).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it('muestra "Pausada" solo cuando está pausada', async () => {
    await render(
      <TestProviders>
        <RoutineCard name="Dormir" icon={null} active={false} lastCompletedAt={null} />
      </TestProviders>,
    );
    expect(screen.getByText('Pausada')).toBeTruthy();
  });

  it('marca "Verificada hoy" con texto y muestra solo la hora cuando ya se verificó hoy', async () => {
    const done = new Date(2026, 10, 4, 8, 15).toISOString();
    await render(
      <TestProviders>
        <RoutineCard name="Salir de casa" icon={null} active lastCompletedAt={done} completedToday onPress={jest.fn()} />
      </TestProviders>,
    );
    expect(screen.getByText('Verificada hoy')).toBeTruthy();
    expect(screen.getByText(/^Hoy, /)).toBeTruthy();
    expect(screen.queryByText(/Última vez/)).toBeNull();
    expect(screen.getByRole('button', { name: /^Salir de casa\. Verificada hoy\. Hoy, / })).toBeTruthy();
  });

  it('sin verificar hoy no muestra la marca y conserva "Última vez"', async () => {
    const before = new Date(2026, 10, 3, 8, 15).toISOString();
    await render(
      <TestProviders>
        <RoutineCard name="Salir de casa" icon={null} active lastCompletedAt={before} />
      </TestProviders>,
    );
    expect(screen.queryByText('Verificada hoy')).toBeNull();
    expect(screen.getByText(/^Última vez: /)).toBeTruthy();
  });
});
