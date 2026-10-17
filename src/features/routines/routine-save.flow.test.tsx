import { act, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';

import { createLocalRepositories, type LocalRepositories } from '@/db/local/local.repositories';
import { createLocalStore, type LocalStore } from '@/db/local/local.store';
import { fixedDeps, memoryStorage } from '@/db/local/testing/memoryStorage';
import { TestProviders } from '@/shared/testing/TestProviders';

import RoutinesScreen from '../../app/(tabs)/index';
import { RoutinesProvider } from './RoutinesProvider';
import type { RoutinesContextValue } from './routines.types';
import { useRoutines } from './useRoutines';

// Datos locales del "teléfono": un store en memoria compartido por el provider y la pantalla.
const mockLocal: { store?: LocalStore; repositories?: LocalRepositories } = {};

jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('@/features/local-data/LocalRepositoriesProvider', () => ({
  useLocalStore: () => mockLocal.store,
  useLocalRepositories: () => mockLocal.repositories,
}));
// Inicio sin lo que no es parte de este flujo (navegación, próxima rutina, IA, sincronización).
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useFocusEffect: jest.fn() }));
jest.mock('@/features/routines/useNextRoutine', () => ({ useNextRoutine: () => ({ next: null, now: new Date() }) }));
jest.mock('@/features/sync/PendingSyncIndicator', () => ({ PendingSyncIndicator: () => null }));
jest.mock('@/features/ai/CreateWithAiButton', () => ({ CreateWithAiButton: () => null }));

const captured: { current: RoutinesContextValue | null } = { current: null };
function CaptureRoutines() {
  const value = useRoutines();
  useEffect(() => {
    captured.current = value;
  }, [value]);
  return null;
}

async function renderHome() {
  await render(
    <TestProviders>
      <RoutinesProvider>
        <CaptureRoutines />
        <RoutinesScreen />
      </RoutinesProvider>
    </TestProviders>,
  );
}

jest.setTimeout(20000);

describe('guardar una rutina (P04 → Inicio)', () => {
  beforeEach(() => {
    mockLocal.store = createLocalStore('user-1', memoryStorage());
    mockLocal.repositories = createLocalRepositories(mockLocal.store, fixedDeps());
  });

  it('queda en la copia local y Inicio la muestra al volver', async () => {
    await renderHome();
    expect(await screen.findByText('Aún no tienes rutinas. Empieza con una plantilla o crea la tuya.')).toBeTruthy();

    let status: string | undefined;
    await act(async () => {
      const result = await captured.current!.createRoutine({
        name: 'Salir al trabajo',
        items: [{ label: 'Llaves', kind: 'carry', critical: true }],
      });
      status = result.status;
    });

    expect(status).toBe('saved');
    expect((await mockLocal.repositories!.routines.getAll()).map((routine) => routine.name)).toEqual(['Salir al trabajo']);
    expect((await mockLocal.repositories!.items.getAll()).map((item) => item.label)).toEqual(['Llaves']);
    expect(await screen.findByText('Salir al trabajo')).toBeTruthy();
  });

  it('sigue ahí al volver a abrir Inicio (se leyó de la copia local, no de la memoria)', async () => {
    await mockLocal.repositories!.routines.create({ name: 'Antes de dormir', icon: 'moon-outline', color: 'blue' });

    await renderHome();

    expect(await screen.findByText('Antes de dormir')).toBeTruthy();
  });

  it('con el formulario vacío no guarda y explica qué falta', async () => {
    await renderHome();
    let result: Awaited<ReturnType<RoutinesContextValue['createRoutine']>> | undefined;
    await act(async () => {
      result = await captured.current!.createRoutine({ name: ' ', items: [] });
    });

    expect(result).toEqual({
      status: 'invalid',
      errors: { name: 'Ponle un nombre a tu rutina.', items: 'Añade al menos un ítem.' },
    });
    expect(await mockLocal.repositories!.routines.getAll()).toEqual([]);
  });
});
