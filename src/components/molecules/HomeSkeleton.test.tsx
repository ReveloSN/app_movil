import { act, render, screen } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { HomeSkeleton } from './HomeSkeleton';

jest.setTimeout(20000);

describe('HomeSkeleton', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('no se muestra si la carga es instantánea (sin parpadeo)', async () => {
    const { rerender } = await render(
      <TestProviders>
        <HomeSkeleton loading accessibilityLabel="Cargando rutinas" />
      </TestProviders>,
    );
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('progressbar')).toBeNull();
    await rerender(
      <TestProviders>
        <HomeSkeleton loading={false} accessibilityLabel="Cargando rutinas" />
      </TestProviders>,
    );
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('aparece pasado el retardo y se anuncia una sola vez', async () => {
    await render(
      <TestProviders>
        <HomeSkeleton loading accessibilityLabel="Cargando rutinas" />
      </TestProviders>,
    );
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.getByRole('progressbar', { name: 'Cargando rutinas' })).toBeTruthy();
  });
});
