import { act, renderHook } from '@testing-library/react-native';

import { useDelayedFlag } from './useDelayedFlag';

describe('useDelayedFlag', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('no se activa si la carga termina antes del retardo', async () => {
    const { result, rerender } = await renderHook(({ active }: { active: boolean }) => useDelayedFlag(active, 150), { initialProps: { active: true } });
    expect(result.current).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    await rerender({ active: false });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe(false);
  });

  it('se activa pasado el retardo y se apaga al terminar', async () => {
    const { result, rerender } = await renderHook(({ active }: { active: boolean }) => useDelayedFlag(active, 150), { initialProps: { active: true } });
    await act(async () => {
      jest.advanceTimersByTime(160);
    });
    expect(result.current).toBe(true);
    await rerender({ active: false });
    expect(result.current).toBe(false);
  });
});
