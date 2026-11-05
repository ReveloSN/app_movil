import { render, screen } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { ProgressRing } from './ProgressRing';

jest.setTimeout(20000);

describe('ProgressRing', () => {
  it('es una barra de progreso con su valor y su texto hablado', async () => {
    await render(
      <TestProviders>
        <ProgressRing value={3} max={8} centerLabel="3/8" accessibilityLabel="3 de 8 ítems listos" />
      </TestProviders>,
    );
    const ring = screen.getByRole('progressbar', { name: '3 de 8 ítems listos' });
    expect(ring.props.accessibilityValue).toEqual({ min: 0, max: 8, now: 3, text: '3 de 8 ítems listos' });
    expect(screen.getByText('3/8')).toBeTruthy();
  });

  it('acota el valor al rango (sin ítems queda en 0)', async () => {
    await render(
      <TestProviders>
        <ProgressRing value={5} max={0} centerLabel="0/0" accessibilityLabel="0 de 0 ítems listos" />
      </TestProviders>,
    );
    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(0);
  });
});
