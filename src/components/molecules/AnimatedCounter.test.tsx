import { act, render, screen } from '@testing-library/react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { TestProviders } from '@/shared/testing/TestProviders';

import { AnimatedCounter } from './AnimatedCounter';

jest.mock('@/shared/hooks/useReducedMotion');
jest.setTimeout(20000);

const mockReduced = jest.mocked(useReducedMotion);

describe('AnimatedCounter', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('con "Quitar animaciones" muestra el valor final y lo expone como etiqueta', async () => {
    mockReduced.mockReturnValue(true);
    await render(
      <TestProviders>
        <AnimatedCounter value={42} />
      </TestProviders>,
    );
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByLabelText('42')).toBeTruthy();
  });

  it('cuenta hasta el valor final y el lector de pantalla oye solo el final', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <AnimatedCounter value={7} />
      </TestProviders>,
    );
    // Durante la cuenta la etiqueta ya es el valor final, no el intermedio.
    expect(screen.getByLabelText('7')).toBeTruthy();
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByLabelText('7')).toBeTruthy();
  });

  it('usa format para porcentajes y rachas, también en la etiqueta', async () => {
    mockReduced.mockReturnValue(true);
    await render(
      <TestProviders>
        <AnimatedCounter value={80} format={(n) => `${n} %`} />
        <AnimatedCounter value={3} format={(n) => `${n} días seguidos`} accessibilityLabel="Racha: tres días seguidos" />
      </TestProviders>,
    );
    expect(screen.getByText('80 %')).toBeTruthy();
    expect(screen.getByLabelText('80 %')).toBeTruthy();
    expect(screen.getByText('3 días seguidos')).toBeTruthy();
    expect(screen.getByLabelText('Racha: tres días seguidos')).toBeTruthy();
  });

  it('muestra cero sin romperse', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <AnimatedCounter value={0} />
      </TestProviders>,
    );
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.getByLabelText('0')).toBeTruthy();
  });
});
