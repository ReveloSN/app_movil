import { renderHook, waitFor } from '@testing-library/react-native';

import { useRoutineStreak } from './useRoutineStreak';

const mockRoutines: { list: { id: string; kind: string }[] } = { list: [] };
const mockStore = { read: jest.fn() };
jest.mock('@/features/routines/useRoutines', () => ({ useRoutines: () => ({ routines: mockRoutines.list }) }));
jest.mock('@/features/local-data/LocalRepositoriesProvider', () => ({ useLocalStore: () => mockStore }));

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const completed = (id: string, days: number) => ({ id, routineId: 'r1', date: daysAgo(days), result: 'completed', itemsChecked: [], durationSeconds: 5 });

beforeEach(() => {
  mockStore.read.mockReset();
  mockStore.read.mockResolvedValue({ records: [completed('a', 0), completed('b', 1), completed('c', 2)], outbox: [] });
});

describe('useRoutineStreak', () => {
  it('rutina de salida: muestra la racha', async () => {
    mockRoutines.list = [{ id: 'r1', kind: 'departure' }];
    const { result } = await renderHook(() => useRoutineStreak('r1'));
    await waitFor(() => expect(result.current).toBe(3));
  });

  it('rutina de llegada: no hay racha que mostrar', async () => {
    mockRoutines.list = [{ id: 'r1', kind: 'arrival' }];
    const { result } = await renderHook(() => useRoutineStreak('r1'));
    expect(result.current).toBeNull();
    expect(mockStore.read).not.toHaveBeenCalled();
  });
});
