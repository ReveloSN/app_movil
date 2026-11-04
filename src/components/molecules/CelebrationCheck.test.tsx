import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { TestProviders } from '@/shared/testing/TestProviders';

import { CelebrationCheck } from './CelebrationCheck';
import { CONFETTI_COUNT, ConfettiBurst, confettiParticles } from './ConfettiBurst';

jest.mock('@/shared/hooks/useReducedMotion');
jest.setTimeout(20000);

const mockReduced = jest.mocked(useReducedMotion);

describe('CelebrationCheck y ConfettiBurst', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('dibuja el confeti con movimiento normal (24 piezas)', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <ConfettiBurst />
      </TestProviders>,
    );
    expect(screen.getByTestId('confetti-burst', { includeHiddenElements: true }).children).toHaveLength(CONFETTI_COUNT);
    expect(confettiParticles(CONFETTI_COUNT)).toHaveLength(24);
  });

  it('con reducir movimiento no dibuja confeti', async () => {
    mockReduced.mockReturnValue(true);
    await render(
      <TestProviders>
        <ConfettiBurst />
      </TestProviders>,
    );
    expect(screen.queryByTestId('confetti-burst', { includeHiddenElements: true })).toBeNull();
  });

  it('anuncia la celebración en voz alta, también con reducir movimiento', async () => {
    mockReduced.mockReturnValue(true);
    await render(
      <TestProviders>
        <CelebrationCheck announcement="Todo listo" />
      </TestProviders>,
    );
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Todo listo');
  });
});
