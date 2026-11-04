import { renderHook, waitFor } from '@testing-library/react-native';
import type { ComponentProps, ReactNode } from 'react';

import { UnsupportedDocumentVersionError } from '@/db/local/local-document.migration';
import { useHistory } from '@/features/history/useHistory';
import { RoutinesProvider } from '@/features/routines/RoutinesProvider';
import { useRoutines } from '@/features/routines/useRoutines';

import { isNewerDataError, localLoadErrorMessage, NEWER_DATA_MESSAGE } from './localData.errors';

jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
jest.mock('@/features/local-data/LocalRepositoriesProvider', () => ({
  useLocalRepositories: () => ({}),
  useLocalStore: () => ({ read: jest.fn(), subscribe: () => () => undefined }),
}));
jest.mock('@/features/sync/SyncProvider', () => ({ useSync: () => ({ syncNow: jest.fn() }) }));
jest.mock('@/features/routines/useRoutines', () => ({ useRoutines: jest.fn(() => ({ refresh: jest.fn() })) }));

jest.setTimeout(20000);

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

const newer = () => new UnsupportedDocumentVersionError(99);

describe('datos locales de una versión más nueva', () => {
  it('el mensaje es dedicado y pide actualizar la app', () => {
    expect(NEWER_DATA_MESSAGE).toBe('Esta versión de la app es más antigua que tus datos; actualízala para seguir.');
    expect(isNewerDataError(newer())).toBe(true);
    expect(isNewerDataError(new Error('x'))).toBe(false);
    expect(localLoadErrorMessage(newer(), 'genérico')).toBe(NEWER_DATA_MESSAGE);
    expect(localLoadErrorMessage(new Error('x'), 'genérico')).toBe('genérico');
  });

  it('Historial muestra el mensaje dedicado, no el genérico', async () => {
    const store = { read: jest.fn().mockRejectedValue(newer()), subscribe: () => () => undefined };
    const { result } = await renderHook(() => useHistory(store));
    await waitFor(() => expect(result.current.error).toBe(NEWER_DATA_MESSAGE));
  });

  it('Historial sigue dando el mensaje genérico para otros fallos', async () => {
    const store = { read: jest.fn().mockRejectedValue(new Error('disco')), subscribe: () => () => undefined };
    const { result } = await renderHook(() => useHistory(store));
    await waitFor(() => expect(result.current.error).toContain('No pudimos leer tu historial'));
  });

  it('Inicio (RoutinesProvider) muestra el mensaje dedicado', async () => {
    const { useRoutines: realUseRoutines } = jest.requireActual<typeof import('@/features/routines/useRoutines')>('@/features/routines/useRoutines');
    jest.mocked(useRoutines).mockImplementation(realUseRoutines);
    const repositories = {
      routines: { getAll: jest.fn().mockRejectedValue(newer()) },
    } as unknown as ComponentProps<typeof RoutinesProvider>['repositories'];
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RoutinesProvider repositories={repositories}>{children}</RoutinesProvider>
    );
    const { result } = await renderHook(() => useRoutines(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(NEWER_DATA_MESSAGE));
  });
});
