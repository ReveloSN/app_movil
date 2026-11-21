import { render, screen } from '@testing-library/react-native';

import { memoryStorage } from '@/db/local/testing/memoryStorage';
import { resetLocaleForTests, setLocale } from '@/shared/i18n/locale.store';
import { TestProviders } from '@/shared/testing/TestProviders';

import { RoutineCard } from './RoutineCard';

jest.setTimeout(20000);

describe('RoutineCard en inglés', () => {
  beforeEach(async () => {
    await setLocale('en', memoryStorage());
  });
  afterEach(resetLocaleForTests);

  it('muestra la marca de hoy, la hora y el estado en inglés', async () => {
    const done = new Date(2026, 10, 4, 18, 5).toISOString();
    await render(
      <TestProviders>
        <RoutineCard name="Leave home" icon={null} active lastCompletedAt={done} completedToday actionLabel="Check again" onAction={jest.fn()} onPress={jest.fn()} />
      </TestProviders>,
    );
    expect(screen.getByText('Checked today')).toBeTruthy();
    expect(screen.getByText('Today, 6:05 PM')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Leave home. Checked today. Today, 6:05 PM.' })).toBeTruthy();
    expect(screen.queryByText(/Hoy|Verificada/)).toBeNull();
  });

  it('una rutina sin verificar y en pausa lo dice en inglés', async () => {
    await render(
      <TestProviders>
        <RoutineCard name="Gym" icon={null} active={false} lastCompletedAt={null} onPress={jest.fn()} />
      </TestProviders>,
    );
    expect(screen.getByText('Paused')).toBeTruthy();
    expect(screen.queryByText(/Pausada|Aún no/)).toBeNull();
  });
});
