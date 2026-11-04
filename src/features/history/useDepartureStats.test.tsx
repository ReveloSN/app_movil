import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createLocalRepositories, type LocalRepositories } from '@/db/local/local.repositories';
import { createLocalStore, type LocalStore } from '@/db/local/local.store';
import { fixedDeps, memoryStorage } from '@/db/local/testing/memoryStorage';
import type { Routine } from '@/shared/types/routine.types';

import { useDepartureStats } from './useDepartureStats';

const mockLocal: { repositories?: LocalRepositories; store?: LocalStore } = {};
const mockRoutines: { list: Routine[]; loading: boolean } = { list: [], loading: false };
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('@/features/local-data/LocalRepositoriesProvider', () => ({
  useLocalRepositories: () => mockLocal.repositories,
  useLocalStore: () => mockLocal.store,
}));
jest.mock('@/features/sync/SyncProvider', () => ({ useSync: () => ({ syncNow: jest.fn() }) }));
jest.mock('@/features/routines/useRoutines', () => ({
  useRoutines: () => ({ routines: mockRoutines.list, loading: mockRoutines.loading, refresh: () => Promise.resolve() }),
}));

jest.setTimeout(20000);

const routine = (id: string, kind: Routine['kind']): Routine => ({
  id,
  userId: 'user-1',
  name: id,
  kind,
  icon: null,
  color: null,
  active: true,
  lastCompletedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const addRecord = (routineId: string, result: 'completed' | 'partial', date = hoursAgo(0)) =>
  mockLocal.repositories!.records.create({ routineId, result, date, itemsChecked: [], durationSeconds: 5 });

beforeEach(() => {
  const store = createLocalStore('user-1', memoryStorage());
  mockLocal.store = store;
  mockLocal.repositories = createLocalRepositories(store, fixedDeps());
  mockRoutines.list = [routine('out', 'departure'), routine('in', 'arrival')];
  mockRoutines.loading = false;
});

describe('useDepartureStats', () => {
  it('sin registros queda vacío una vez leído el historial', async () => {
    const { result } = await renderHook(() => useDepartureStats());
    await waitFor(() => expect(result.current.status).toBe('empty'));
    expect(result.current.summary.totalRecords).toBe(0);
  });

  it('con datos: cuenta solo las rutinas de salida', async () => {
    await addRecord('out', 'completed');
    await addRecord('out', 'partial');
    await addRecord('in', 'completed');
    const { result } = await renderHook(() => useDepartureStats());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.summary).toMatchObject({ totalDepartures: 1, totalRecords: 2, currentStreak: 1 });
    expect(result.current.summary.last7Days).toMatchObject({ completed: 1, partial: 1, rate: 0.5 });
  });

  it('solo rutinas de llegada: queda vacío', async () => {
    await addRecord('in', 'completed');
    const { result } = await renderHook(() => useDepartureStats());
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('sigue cargando mientras no llegan las rutinas', async () => {
    mockRoutines.list = [];
    mockRoutines.loading = true;
    await addRecord('out', 'completed');
    const { result } = await renderHook(() => useDepartureStats());
    await act(async () => undefined);
    expect(result.current.status).toBe('loading');
  });

  it('no recalcula en cada render y se actualiza al cambiar los datos', async () => {
    await addRecord('out', 'completed');
    const { result, rerender } = await renderHook(() => useDepartureStats());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const first = result.current.summary;

    await rerender({});
    expect(result.current.summary).toBe(first);

    await act(async () => {
      await addRecord('out', 'completed', hoursAgo(1));
    });
    await waitFor(() => expect(result.current.summary.totalDepartures).toBe(2));
    expect(result.current.summary).not.toBe(first);
  });
});
