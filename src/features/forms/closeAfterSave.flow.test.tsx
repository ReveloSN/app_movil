import { router, Stack, Tabs } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { createLocalRepositories, type LocalRepositories } from '@/db/local/local.repositories';
import { createLocalStore, type LocalStore } from '@/db/local/local.store';
import { fixedDeps, memoryStorage } from '@/db/local/testing/memoryStorage';
import { ToastProvider } from '@/features/feedback/ToastProvider';
import { RoutineForm } from '@/features/routines/RoutineForm';
import { RoutinesProvider } from '@/features/routines/RoutinesProvider';
import { useRoutines } from '@/features/routines/useRoutines';
import { TriggerDraftsProvider } from '@/features/triggers/TriggerDraftsProvider';
import { TestProviders } from '@/shared/testing/TestProviders';

// Flujo real de P04 con el enrutador de Expo en memoria: Inicio en (tabs) y P04 en la pila anidada
// routine/, como en la app. Antes del arreglo, con cambios sin guardar (DC-03 activo) la pantalla no se
// cerraba al guardar: dismissTo, re-despachado desde la pila anidada, no llegaba a ninguna parte.

const mockLocal: { store?: LocalStore; repositories?: LocalRepositories } = {};
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('@/features/local-data/LocalRepositoriesProvider', () => ({
  useLocalStore: () => mockLocal.store,
  useLocalRepositories: () => mockLocal.repositories,
}));
jest.mock('@/features/notifications/TriggerRuntimeProvider', () => ({
  useTriggerRuntime: () => ({ rearm: () => Promise.resolve() }),
}));
// Fuera de este flujo: sugerencias (IA) y avisos (P06).
jest.mock('@/features/routines/ItemSuggestions', () => ({ ItemSuggestions: () => null }));
jest.mock('@/features/triggers/RoutineTriggersSection', () => ({ RoutineTriggersSection: () => null }));

jest.setTimeout(30000);

function Providers({ children }: { children: ReactNode }) {
  return (
    <TestProviders>
      <ToastProvider>
        <RoutinesProvider>
          <TriggerDraftsProvider>{children}</TriggerDraftsProvider>
        </RoutinesProvider>
      </ToastProvider>
    </TestProviders>
  );
}

function HomeList() {
  const { routines } = useRoutines();
  return (
    <>
      <Text>Inicio</Text>
      {routines.map((routine) => (
        <Text key={routine.id}>{routine.name}</Text>
      ))}
    </>
  );
}

const DRAFT = { name: '', items: [{ label: 'Llaves', kind: 'carry' as const, critical: true }] };

function renderFlow() {
  const result = renderRouter(
    {
      _layout: () => (
        <Providers>
          <Stack screenOptions={{ headerShown: false }} />
        </Providers>
      ),
      '(tabs)/_layout': () => <Tabs />,
      '(tabs)/index': HomeList,
      'routine/_layout': () => <Stack />,
      'routine/templates': () => <Text>Plantillas</Text>,
      'routine/new': () => <RoutineForm formId="form-1" initialDraft={DRAFT} />,
    },
    { initialUrl: '/' },
  );
  return result;
}

/** Escribir el nombre deja cambios sin guardar: DC-03 queda activo, como en el teléfono. */
async function typeName() {
  await fireEvent.changeText(screen.getByLabelText('Nombre de la rutina'), 'Salir al trabajo');
}

describe('guardar en P04 cierra la pantalla (flujo con el enrutador)', () => {
  beforeEach(() => {
    mockLocal.store = createLocalStore('user-1', memoryStorage());
    mockLocal.repositories = createLocalRepositories(mockLocal.store, fixedDeps());
  });

  it('crear: se cierra, vuelve a Inicio, avisa y la rutina aparece', async () => {
    const result = renderFlow();
    await result;
    await act(async () => {
      router.push('/routine/new');
    });
    expect(result.getPathname()).toBe('/routine/new');

    await typeName();
    await fireEvent.press(screen.getByRole('button', { name: 'Crear rutina' }));

    expect(result.getPathname()).toBe('/');
    expect(await screen.findByText('Rutina guardada.')).toBeTruthy();
    expect(screen.getByText('Salir al trabajo')).toBeTruthy();
  });

  it('desde Plantillas (flujo B) cierra todo el flujo hasta Inicio', async () => {
    const result = renderFlow();
    await result;
    await act(async () => {
      router.push('/routine/templates');
      router.push('/routine/new');
    });

    await typeName();
    await fireEvent.press(screen.getByRole('button', { name: 'Crear rutina' }));

    expect(result.getPathname()).toBe('/');
    expect(screen.queryByText('Plantillas')).toBeNull();
  });

  it('si guardar falla, la pantalla no se cierra y muestra el error', async () => {
    jest.spyOn(mockLocal.repositories!.routines, 'create').mockRejectedValueOnce(new Error('disco lleno'));
    const result = renderFlow();
    await result;
    await act(async () => {
      router.push('/routine/new');
    });

    await typeName();
    await fireEvent.press(screen.getByRole('button', { name: 'Crear rutina' }));

    expect(result.getPathname()).toBe('/routine/new');
    expect(screen.getByText(/No se pudo guardar la rutina/)).toBeTruthy();
    expect(screen.queryByText('Rutina guardada.')).toBeNull();
  });
});
