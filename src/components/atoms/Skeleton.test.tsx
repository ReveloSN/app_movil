import { act, render, screen } from '@testing-library/react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { TestProviders } from '@/shared/testing/TestProviders';

import { Skeleton, SkeletonGroup } from './Skeleton';

jest.mock('@/shared/hooks/useReducedMotion');
jest.setTimeout(20000);

const mockReduced = jest.mocked(useReducedMotion);

const flatStyle = (testID: string) =>
  Object.assign({}, ...[screen.getByTestId(testID, { includeHiddenElements: true }).props.style].flat(3).filter(Boolean));

describe('Skeleton', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('dibuja las tres variantes con su forma', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <Skeleton variant="line" />
        <Skeleton variant="circle" width={40} />
        <Skeleton variant="card" />
      </TestProviders>,
    );
    expect(flatStyle('skeleton-line')).toMatchObject({ height: 16, width: '100%' });
    expect(flatStyle('skeleton-circle')).toMatchObject({ height: 40, width: 40, borderRadius: 20 });
    expect(flatStyle('skeleton-card')).toMatchObject({ height: 96 });
  });

  it('el grupo se anuncia una sola vez como "Cargando" y sus bloques no se leen', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <SkeletonGroup>
          <Skeleton />
          <Skeleton />
        </SkeletonGroup>
      </TestProviders>,
    );
    expect(screen.getByRole('progressbar', { name: 'Cargando' })).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-line', { includeHiddenElements: true })[0].props.accessibilityElementsHidden).toBe(true);
  });

  it('con movimiento normal arranca en el punto bajo del pulso', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <Skeleton />
      </TestProviders>,
    );
    expect(flatStyle('skeleton-line').opacity).toBe(0.55);
  });

  it('con reducir movimiento queda quieto', async () => {
    mockReduced.mockReturnValue(true);
    await render(
      <TestProviders>
        <Skeleton />
      </TestProviders>,
    );
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    // Quieto y fijo, sin pulso.
    expect(flatStyle('skeleton-line').opacity).toBe(0.7);
  });
});
