import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { TestProviders } from '@/shared/testing/TestProviders';

import { EmptyState } from './EmptyState';

jest.mock('@/shared/hooks/useReducedMotion');
jest.setTimeout(20000);

const mockReduced = jest.mocked(useReducedMotion);

const transformOf = () =>
  JSON.stringify(
    Object.assign({}, ...[screen.getByTestId('empty-illustration', { includeHiddenElements: true }).props.style].flat(3).filter(Boolean)).transform,
  );

describe('EmptyState', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each(['noRoutines', 'noResults', 'allDone'] as const)('dibuja la ilustración %s con título, texto y acción', async (kind) => {
    mockReduced.mockReturnValue(false);
    const onPress = jest.fn();
    await render(
      <TestProviders>
        <EmptyState illustration={kind} title="Aún no tienes rutinas" message="Empieza con una plantilla." action={{ label: 'Ver plantillas', onPress }} />
      </TestProviders>,
    );
    expect(screen.getByRole('header', { name: 'Aún no tienes rutinas' })).toBeTruthy();
    expect(screen.getByText('Empieza con una plantilla.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ver plantillas' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('la ilustración es decorativa: el lector de pantalla la salta', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <EmptyState illustration="allDone" message="Todo al día." />
      </TestProviders>,
    );
    const art = screen.getByTestId('empty-illustration', { includeHiddenElements: true });
    expect(art.props.accessibilityElementsHidden).toBe(true);
    expect(art.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('con reducir movimiento la ilustración no se anima', async () => {
    mockReduced.mockReturnValue(true);
    await render(
      <TestProviders>
        <EmptyState illustration="noResults" message="Sin resultados." />
      </TestProviders>,
    );
    const before = transformOf();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(transformOf()).toBe(before);
  });

  it('sin ilustración sigue mostrando el ícono y el mensaje', async () => {
    mockReduced.mockReturnValue(false);
    await render(
      <TestProviders>
        <EmptyState icon="time-outline" message="Sin historial." />
      </TestProviders>,
    );
    expect(screen.getByLabelText('Sin historial.')).toBeTruthy();
    expect(screen.queryByTestId('empty-illustration', { includeHiddenElements: true })).toBeNull();
  });
});
