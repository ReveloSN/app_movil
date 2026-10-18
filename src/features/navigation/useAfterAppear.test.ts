import { renderHook } from '@testing-library/react-native';

import { useAfterAppear, type AppearEvents } from './useAfterAppear';

jest.mock('expo-router', () => ({ useNavigation: () => ({}) }));

function fakeEvents() {
  const listeners = new Set<(event: { data?: { closing?: boolean } }) => void>();
  const events: AppearEvents = {
    addListener: (_type, listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const emit = (closing: boolean) => listeners.forEach((listener) => listener({ data: { closing } }));
  return { events, emit, count: () => listeners.size };
}

describe('useAfterAppear', () => {
  it('se llama al terminar de aparecer, no mientras se cierra', async () => {
    const { events, emit } = fakeEvents();
    const callback = jest.fn();
    await renderHook(() => useAfterAppear(callback, events));

    emit(true);
    expect(callback).not.toHaveBeenCalled();

    emit(false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('usa la versión más reciente del callback y deja de escuchar al desmontarse', async () => {
    const { events, emit, count } = fakeEvents();
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, unmount } = await renderHook(({ cb }: { cb: () => void }) => useAfterAppear(cb, events), {
      initialProps: { cb: first },
    });

    await rerender({ cb: second });
    emit(false);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    await unmount();
    expect(count()).toBe(0);
  });
});
