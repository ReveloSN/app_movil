import { fireEvent, render, screen } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { NextRoutineCard } from './NextRoutineCard';

jest.setTimeout(20000);

describe('NextRoutineCard', () => {
  it('su "Verificar ahora" es un botón con el nombre de la rutina para el lector de pantalla', async () => {
    const onAction = jest.fn();
    await render(
      <TestProviders>
        <NextRoutineCard
          label="Próxima rutina"
          name="Salir de casa"
          when="Hoy, 6:00 p. m."
          actionLabel="Verificar ahora"
          onAction={onAction}
          icon="home-outline"
          accentColor="#096B4C"
          accentTint="#DDF0E6"
        />
      </TestProviders>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Verificar ahora, Salir de casa' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('ofrece "Modo salida" como acción discreta solo si se le pasa', async () => {
    const onSecondary = jest.fn();
    const props = {
      label: 'Próxima rutina',
      name: 'Salir de casa',
      when: 'Hoy, 6:00 p. m.',
      actionLabel: 'Verificar ahora',
      onAction: jest.fn(),
      icon: 'home-outline' as const,
      accentColor: '#096B4C',
      accentTint: '#DDF0E6',
    };
    await render(
      <TestProviders>
        <NextRoutineCard {...props} secondaryLabel="Modo salida" onSecondaryAction={onSecondary} />
      </TestProviders>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Modo salida' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
    expect(props.onAction).not.toHaveBeenCalled();
  });
});
